-- Add rejection_reason and helpful_count
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;

-- Index for moderation queue and product lookups
CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON public.reviews (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON public.reviews (product_id, status);

-- Stronger spam filter + rate limiting trigger
CREATE OR REPLACE FUNCTION public.filter_review_spam()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
  same_product_count integer;
  body_lower text;
  letter_count integer;
  upper_count integer;
BEGIN
  body_lower := lower(coalesce(NEW.body, ''));

  -- 1) Hard spam signals -> auto reject
  -- 2+ URLs
  IF (length(NEW.body) - length(replace(lower(NEW.body), 'http', ''))) / 4 >= 2 THEN
    NEW.status := 'rejected';
    NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Multiple links detected');
  END IF;

  -- Any URL + suspicious keywords
  IF NEW.body ~* '(https?://|www\.|\.com|\.net|\.xyz|\.shop)' AND
     body_lower ~ '(buy|cheap|discount|click|visit|promo|casino|loan|crypto|bitcoin|viagra|porn)' THEN
    NEW.status := 'rejected';
    NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Promotional link');
  END IF;

  -- Phone numbers (8+ digits in a row, or grouped)
  IF NEW.body ~ '(\+?\d[\d\s\-]{7,}\d)' THEN
    NEW.status := 'rejected';
    NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Contact number in review');
  END IF;

  -- Repeated character runs (aaaaaaaa)
  IF NEW.body ~ '(.)\1{7,}' THEN
    NEW.status := 'rejected';
    NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Repetitive characters');
  END IF;

  -- Repeated word loops (e.g. "spam spam spam spam")
  IF body_lower ~ '(\m\w+\M)(\s+\1){4,}' THEN
    NEW.status := 'rejected';
    NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Repeated word pattern');
  END IF;

  -- All caps shouting (long body, mostly uppercase)
  letter_count := length(regexp_replace(NEW.body, '[^A-Za-z]', '', 'g'));
  upper_count := length(regexp_replace(NEW.body, '[^A-Z]', '', 'g'));
  IF letter_count >= 30 AND upper_count::float / NULLIF(letter_count, 0) > 0.8 THEN
    NEW.status := 'rejected';
    NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'All-caps content');
  END IF;

  -- Very short body
  IF length(btrim(NEW.body)) < 10 THEN
    NEW.status := 'rejected';
    NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Review too short');
  END IF;

  -- 2) Rate limiting (per signed-in user). Anonymous (user_id IS NULL) gets per-product throttle only.
  IF NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO recent_count
    FROM public.reviews
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '1 hour';

    IF recent_count >= 3 THEN
      NEW.status := 'rejected';
      NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Too many submissions in the last hour');
    END IF;
  END IF;

  -- One review per product per author (signed-in) per 24h
  IF NEW.user_id IS NOT NULL AND NEW.product_id IS NOT NULL THEN
    SELECT count(*) INTO same_product_count
    FROM public.reviews
    WHERE user_id = NEW.user_id
      AND product_id = NEW.product_id
      AND created_at > now() - interval '24 hours';

    IF same_product_count >= 1 THEN
      NEW.status := 'rejected';
      NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Already reviewed this product today');
    END IF;
  END IF;

  -- Anonymous: throttle per (reviewer_name, product) per 24h to slow drive-by spam
  IF NEW.user_id IS NULL AND NEW.product_id IS NOT NULL THEN
    SELECT count(*) INTO same_product_count
    FROM public.reviews
    WHERE user_id IS NULL
      AND product_id = NEW.product_id
      AND lower(reviewer_name) = lower(NEW.reviewer_name)
      AND created_at > now() - interval '24 hours';

    IF same_product_count >= 1 THEN
      NEW.status := 'rejected';
      NEW.rejection_reason := COALESCE(NEW.rejection_reason, 'Duplicate submission for this product');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trg_filter_review_spam ON public.reviews;
CREATE TRIGGER trg_filter_review_spam
BEFORE INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.filter_review_spam();
