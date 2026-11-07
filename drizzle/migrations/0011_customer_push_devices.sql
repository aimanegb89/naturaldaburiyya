CREATE TABLE public.customer_push_devices (
  token text PRIMARY KEY,
  locale text NOT NULL DEFAULT 'ar',
  user_id uuid,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.customer_push_devices TO service_role;
ALTER TABLE public.customer_push_devices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.push_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by uuid,
  title jsonb NOT NULL,
  body jsonb NOT NULL,
  link text NOT NULL DEFAULT '/',
  targeted integer NOT NULL DEFAULT 0,
  delivered integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.push_broadcasts TO authenticated;
GRANT ALL ON public.push_broadcasts TO service_role;
ALTER TABLE public.push_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read broadcasts" ON public.push_broadcasts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));