-- ==========================================
-- TABELA member_areas - Areas de Membros
-- Execute no SQL Editor do Supabase
-- ==========================================

CREATE TABLE IF NOT EXISTS member_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  button_text text NOT NULL DEFAULT 'Acessar',
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_member_areas_updated_at
  BEFORE UPDATE ON member_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE member_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active member areas"
  ON member_areas FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert member areas"
  ON member_areas FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Admin can update member areas"
  ON member_areas FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Admin can delete member areas"
  ON member_areas FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- Inserir areas atuais
INSERT INTO member_areas (slug, title, subtitle, icon, button_text, position) VALUES
  ('pt', 'Mestra Lian', 'Caminhando com Lian', '🇧🇷', 'Acessar Área de Membros', 0),
  ('en', 'Master Mei', 'Walking with Mei', '🇺🇸', 'Access Member Area', 1),
  ('es', 'Maestra Yuna', 'Caminando con Yuna', '🇪🇸', 'Acceder al Área de Miembros', 2),
  ('de', 'Meisterin Yuki', 'Der Weg mit Yuki', '🇩🇪', 'Mitgliederbereich Zugreifen', 3),
  ('fr', 'Maître Yumi', 'Cheminer avec Yumi', '🇫🇷', 'Accéder à l''Espace Membre', 4),
  ('it', 'Maestra Kaori', 'Camminando con Kaori', '🇮🇹', 'Accedi all''Area Membri', 5);
