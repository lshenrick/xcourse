-- Add custom_labels to course_lessons for per-lesson text customization
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS custom_labels jsonb DEFAULT '{}';

-- Add custom_labels to member_areas for per-area text customization (fallback)
ALTER TABLE member_areas ADD COLUMN IF NOT EXISTS custom_labels jsonb DEFAULT '{}';

-- Per-lesson labels override per-area labels, which override default translations.
-- Example custom_labels:
-- {
--   "audioTitle": "Áudio da Aula 3",
--   "audioDescription": "Ouça com atenção",
--   "ebookTitle": "Material Complementar",
--   "ebookDescription": "Baixe o PDF abaixo"
-- }
