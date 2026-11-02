-- A1: orders only via place-order (service role)
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;
REVOKE INSERT ON public.orders FROM authenticated, anon;
REVOKE INSERT ON public.order_items FROM authenticated, anon;

-- A5: idempotency
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uniq ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- A5: atomic order + items
CREATE OR REPLACE FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb)
RETURNS TABLE(id uuid, tracking_code text, order_number integer, total_amount numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
  INSERT INTO public.orders(user_id, address_id, total_amount, status, notes, customer_name, customer_phone, delivery_address, idempotency_key)
  VALUES (NULLIF(p_order->>'user_id','')::uuid, NULLIF(p_order->>'address_id','')::uuid, (p_order->>'total_amount')::numeric, 'new',
          NULLIF(p_order->>'notes',''), p_order->>'customer_name', p_order->>'customer_phone', p_order->>'delivery_address', NULLIF(p_order->>'idempotency_key',''))
  RETURNING * INTO o;
  INSERT INTO public.order_items(order_id, product_id, product_name, size, quantity, price)
  SELECT o.id, i->>'product_id', i->>'product_name', i->>'size', (i->>'quantity')::int, (i->>'price')::numeric
  FROM jsonb_array_elements(p_items) i;
  RETURN QUERY SELECT o.id, o.tracking_code, o.order_number, o.total_amount;
END $$;
REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO service_role;

-- A2: atomic OTP attempt
CREATE OR REPLACE FUNCTION public.otp_try(p_phone text)
RETURNS SETOF public.phone_otps LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.phone_otps SET attempts = attempts + 1 WHERE phone = p_phone AND attempts < 5 RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.otp_try(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.otp_try(text) TO service_role;

-- Rate limits (A2/A4/A5): simple hourly counters
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text NOT NULL,
  bucket timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, bucket)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_key text, p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c integer;
BEGIN
  INSERT INTO public.rate_limits(key, bucket, count) VALUES (p_key, date_trunc('hour', now()), 1)
  ON CONFLICT (key, bucket) DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO c;
  DELETE FROM public.rate_limits WHERE bucket < now() - interval '1 day';
  RETURN c <= p_limit;
END $$;
REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer) TO service_role;

-- A2: block synthetic phone domain unless created by whatsapp-otp
CREATE OR REPLACE FUNCTION public.guard_phone_domain()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) LIKE '%@phone.natural.local' AND coalesce(NEW.raw_app_meta_data->>'provider_phone','') <> 'true' THEN
    RAISE EXCEPTION 'This email domain is reserved';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_phone_domain ON auth.users;
CREATE TRIGGER guard_phone_domain BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.guard_phone_domain();

-- B11: unique among active orders, error when exhausted
CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer; tries integer := 0;
BEGIN
  IF NEW.order_number IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    n := 100 + floor(random() * 900)::int;
    tries := tries + 1;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.orders WHERE order_number = n
        AND (status NOT IN ('done','completed') OR updated_at > now() - interval '1 day'));
    IF tries > 300 THEN
      SELECT g INTO n FROM generate_series(100, 999) g
       WHERE NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = g AND status NOT IN ('done','completed'))
       ORDER BY random() LIMIT 1;
      IF n IS NULL THEN RAISE EXCEPTION 'no_order_numbers_available'; END IF;
      EXIT;
    END IF;
  END LOOP;
  NEW.order_number := n;
  RETURN NEW;
END $$;

-- B6: address deletion keeps orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_address_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL;

-- A4/B2: sweep based on last status change; hourly backstop + admin board load
CREATE OR REPLACE FUNCTION public.auto_done_sweep()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE mins integer; c integer;
BEGIN
  SELECT auto_done_minutes INTO mins FROM public.store_settings WHERE id = 1;
  UPDATE public.orders SET status = 'done'
   WHERE status IN ('new','preparing') AND updated_at < now() - make_interval(mins => coalesce(mins, 60));
  GET DIAGNOSTICS c = ROW_COUNT;
  RETURN c;
END $$;
REVOKE ALL ON FUNCTION public.auto_done_sweep() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_done_sweep() TO authenticated, service_role;
SELECT cron.unschedule('auto-done-sweep') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-done-sweep');
SELECT cron.schedule('auto-done-sweep', '0 * * * *', 'SELECT public.auto_done_sweep()');

-- A6: reminder idempotency + shared key for scheduled calls
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS last_reminder_date date;
CREATE TABLE IF NOT EXISTS public.internal_keys (name text PRIMARY KEY, value text NOT NULL);
GRANT ALL ON public.internal_keys TO service_role;
ALTER TABLE public.internal_keys ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_keys(name, value) VALUES ('cron', md5(random()::text || clock_timestamp()::text) || md5(random()::text)) ON CONFLICT (name) DO NOTHING;
SELECT cron.unschedule('availability-reminder') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'availability-reminder');
SELECT cron.schedule('availability-reminder', '50 13,14 * * *', $c$
  SELECT net.http_post(
    url := 'https://elsopdxvwyxvrbpdozng.supabase.co/functions/v1/availability-reminder',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-key',(SELECT value FROM public.internal_keys WHERE name='cron')),
    body := '{}'::jsonb)
$c$);

-- B9: admins can delete product images
DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- B12: rating summary
CREATE OR REPLACE VIEW public.product_rating_summary WITH (security_invoker = true) AS
  SELECT product_id, round(avg(rating)::numeric, 2) AS avg, count(*)::int AS count
  FROM public.product_reviews GROUP BY product_id;
GRANT SELECT ON public.product_rating_summary TO anon, authenticated, service_role;

-- A3 backfill: remove leaked phones/emails from reviewer names
UPDATE public.product_reviews SET reviewer_name = NULL
 WHERE reviewer_name ~ '^\+?\d{9,15}$' OR reviewer_name LIKE '%@%';