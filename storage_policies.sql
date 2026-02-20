-- ==========================================
-- POLÍTICAS DE STORAGE - Bucket course-files
-- Execute no SQL Editor do Supabase
-- ==========================================

-- Permitir upload de arquivos para usuários autenticados
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-files'
  AND auth.role() = 'authenticated'
);

-- Permitir leitura de arquivos para todos
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-files'
);

-- Permitir atualização de arquivos para usuários autenticados
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-files'
  AND auth.role() = 'authenticated'
);

-- Permitir exclusão de arquivos para usuários autenticados
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-files'
  AND auth.role() = 'authenticated'
);
