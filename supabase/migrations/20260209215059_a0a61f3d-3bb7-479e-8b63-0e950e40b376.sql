CREATE POLICY "Authenticated Users Can Update Assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'assets' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');