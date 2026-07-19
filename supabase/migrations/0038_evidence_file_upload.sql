-- 0038_evidence_file_upload.sql
-- Add file metadata support to evidence_items and create Supabase Storage bucket policy

-- Add file metadata columns to evidence_items
ALTER TABLE evidence_items
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(512),
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Create the evidence-files storage bucket (idempotent via DO block)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'evidence-files',
    'evidence-files',
    true,
    52428800,
    ARRAY[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ]
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN others THEN
    NULL;
END;
$$;

-- Drop and recreate RLS policies (safe because we drop first)
DO $$
BEGIN
  DROP POLICY IF EXISTS "evidence_files_read_policy" ON storage.objects;
  DROP POLICY IF EXISTS "evidence_files_upload_policy" ON storage.objects;
  DROP POLICY IF EXISTS "evidence_files_delete_policy" ON storage.objects;
EXCEPTION WHEN undefined_table THEN NULL;
END;
$$;

CREATE POLICY "evidence_files_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence-files');

CREATE POLICY "evidence_files_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence-files'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "evidence_files_delete_policy"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'evidence-files'
    AND auth.role() = 'authenticated'
  );
