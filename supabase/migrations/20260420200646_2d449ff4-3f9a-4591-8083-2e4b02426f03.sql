
-- Drop the overly broad select policy
DROP POLICY "Anyone can view product images" ON storage.objects;

-- Replace with a policy that still allows viewing files but scoped to the bucket
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images' AND auth.role() = 'anon' OR bucket_id = 'product-images' AND auth.role() = 'authenticated');
