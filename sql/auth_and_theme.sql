-- Toggle de autenticação: se false, qualquer pessoa acessa sem login
ALTER TABLE member_areas ADD COLUMN IF NOT EXISTS require_auth boolean DEFAULT true;

-- Tema da área: 'dark' ou 'light'
ALTER TABLE member_areas ADD COLUMN IF NOT EXISTS theme varchar(10) DEFAULT 'dark';
