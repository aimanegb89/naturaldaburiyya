ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number integer;

CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE n integer; tries integer := 0;
BEGIN
  IF NEW.order_number IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    n := 100 + floor(random() * 900)::int;
    tries := tries + 1;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.orders WHERE order_number = n
        AND (status NOT IN ('done','completed') OR created_at > now() - interval '30 days')
    ) OR tries > 200;
  END LOOP;
  NEW.order_number := n;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_assign_number ON public.orders;
CREATE TRIGGER orders_assign_number BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.assign_order_number();

UPDATE public.orders o SET order_number = s.n
FROM (SELECT id, 100 + ((row_number() OVER (ORDER BY random()) * 397) % 900)::int AS n FROM public.orders WHERE order_number IS NULL) s
WHERE o.id = s.id;

CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);