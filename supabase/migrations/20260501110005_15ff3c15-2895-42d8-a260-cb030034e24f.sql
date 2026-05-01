-- Reviews table with approval workflow
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reviews_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT reviews_name_len CHECK (char_length(reviewer_name) BETWEEN 2 AND 80),
  CONSTRAINT reviews_body_len CHECK (char_length(body) BETWEEN 5 AND 2000)
);

CREATE INDEX idx_reviews_product_status ON public.reviews(product_id, status);
CREATE INDEX idx_reviews_status_created ON public.reviews(status, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews (public bakery site)
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
USING (status = 'approved');

-- Authors can view their own reviews (any status)
CREATE POLICY "Users can view own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Admins can view everything
CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Anyone (even guests) can submit a review; it lands as 'pending'
CREATE POLICY "Anyone can submit a review"
ON public.reviews FOR INSERT
WITH CHECK (status = 'pending');

-- Admins can moderate (approve / reject / edit)
CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete reviews"
ON public.reviews FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Lightweight spam filter: reject obvious link spam / repeated chars on insert
CREATE OR REPLACE FUNCTION public.filter_review_spam()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-reject if body contains 2+ URLs or known spam markers
  IF (length(regexp_replace(NEW.body, '[^h]', '', 'g')) >= 2
      AND NEW.body ~* '(https?://|www\.)') THEN
    NEW.status := 'rejected';
  END IF;
  -- Auto-reject overly repetitive content (e.g. "aaaaaaaaaa")
  IF NEW.body ~ '(.)\1{9,}' THEN
    NEW.status := 'rejected';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_spam_filter
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.filter_review_spam();