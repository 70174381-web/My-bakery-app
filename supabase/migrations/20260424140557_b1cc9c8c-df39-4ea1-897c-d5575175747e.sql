-- Drop the old per-product link column
ALTER TABLE public.product_variants DROP COLUMN IF EXISTS product_id;
ALTER TABLE public.product_variants DROP COLUMN IF EXISTS sort_order;

-- New join table for many-to-many
CREATE TABLE public.product_variant_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id, variant_id)
);

CREATE INDEX idx_pvl_product_id ON public.product_variant_links(product_id);
CREATE INDEX idx_pvl_variant_id ON public.product_variant_links(variant_id);

ALTER TABLE public.product_variant_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variant links"
ON public.product_variant_links
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert variant links"
ON public.product_variant_links
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update variant links"
ON public.product_variant_links
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete variant links"
ON public.product_variant_links
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));