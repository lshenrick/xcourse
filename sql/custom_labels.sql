-- Add custom_labels column to member_areas for overriding default UI texts per area
ALTER TABLE member_areas ADD COLUMN IF NOT EXISTS custom_labels jsonb DEFAULT '{}';

-- Example of what custom_labels can contain:
-- {
--   "audioTitle": "Minha Meditação",
--   "audioDescription": "Ouça com atenção",
--   "ebookTitle": "Material de Apoio",
--   "ebookDescription": "Baixe o arquivo abaixo",
--   "videoPlaceholder": "Vídeo em breve"
-- }
