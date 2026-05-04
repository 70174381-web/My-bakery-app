CREATE TABLE public.custom_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'cake',
  occasion TEXT,
  servings INTEGER,
  needed_by DATE,
  budget TEXT,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a custom quote"
  ON public.custom_quotes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view custom quotes"
  ON public.custom_quotes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update custom quotes"
  ON public.custom_quotes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_custom_quotes_updated_at
  BEFORE UPDATE ON public.custom_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();