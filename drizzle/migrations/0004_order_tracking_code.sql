ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_code text;
UPDATE public.orders SET tracking_code = upper(substr(replace(id::text,'-',''),1,8)) WHERE tracking_code IS NULL;
ALTER TABLE public.orders ALTER COLUMN tracking_code SET DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text),1,8));
CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_code_key ON public.orders(tracking_code);