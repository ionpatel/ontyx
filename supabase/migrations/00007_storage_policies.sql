-- Storage bucket policies for logos and avatars

-- Logos bucket policies
CREATE POLICY "logos_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'logos');

CREATE POLICY "logos_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'logos');

CREATE POLICY "logos_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'logos');

-- Avatars bucket policies
CREATE POLICY "avatars_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars');
