ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash','card'));
CREATE OR REPLACE FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb)
 RETURNS TABLE(id uuid, tracking_code text, order_number integer, total_amount numeric)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE o public.orders%ROWTYPE;
BEGIN
  INSERT INTO public.orders(user_id, address_id, total_amount, status, notes, customer_name, customer_phone, delivery_address, idempotency_key, payment_method)
  VALUES (NULLIF(p_order->>'user_id','')::uuid, NULLIF(p_order->>'address_id','')::uuid, (p_order->>'total_amount')::numeric, 'new',
          NULLIF(p_order->>'notes',''), p_order->>'customer_name', p_order->>'customer_phone', p_order->>'delivery_address', NULLIF(p_order->>'idempotency_key',''), NULLIF(p_order->>'payment_method',''))
  RETURNING * INTO o;
  INSERT INTO public.order_items(order_id, product_id, product_name, size, quantity, price)
  SELECT o.id, i->>'product_id', i->>'product_name', i->>'size', (i->>'quantity')::int, (i->>'price')::numeric
  FROM jsonb_array_elements(p_items) i;
  RETURN QUERY SELECT o.id, o.tracking_code, o.order_number, o.total_amount;
END $function$;