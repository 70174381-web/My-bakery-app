ALTER TABLE public.custom_quotes
  ADD COLUMN IF NOT EXISTS offered_price numeric,
  ADD COLUMN IF NOT EXISTS admin_message text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

CREATE OR REPLACE FUNCTION public.lookup_custom_quotes(_contact text)
RETURNS TABLE (
  id uuid,
  customer_name text,
  request_type text,
  occasion text,
  servings integer,
  needed_by date,
  budget text,
  details text,
  status text,
  offered_price numeric,
  admin_message text,
  responded_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, customer_name, request_type, occasion, servings, needed_by,
         budget, details, status, offered_price, admin_message, responded_at, created_at
  FROM public.custom_quotes
  WHERE lower(btrim(contact)) = lower(btrim(_contact))
  ORDER BY created_at DESC
  LIMIT 20;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_custom_quotes(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_custom_quotes(text) TO anon, authenticated;