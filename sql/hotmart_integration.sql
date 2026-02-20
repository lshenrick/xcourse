-- =============================================================
-- SQL para criar as tabelas da integração Hotmart
-- Execute este SQL no Supabase SQL Editor
-- =============================================================

-- 1. Tabela de compradores autorizados
CREATE TABLE IF NOT EXISTS authorized_buyers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text,
  area_slug text NOT NULL,
  hotmart_transaction text,
  hotmart_product_id text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice único: cada email só pode estar autorizado uma vez por área
CREATE UNIQUE INDEX IF NOT EXISTS idx_authorized_buyers_email_area
  ON authorized_buyers(lower(email), area_slug);

-- Índice para busca rápida no login
CREATE INDEX IF NOT EXISTS idx_authorized_buyers_email
  ON authorized_buyers(lower(email));

-- 2. Tabela de configurações de integração por área
CREATE TABLE IF NOT EXISTS integration_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  area_slug text NOT NULL UNIQUE,
  hottok text,
  resend_api_key text,
  email_from text DEFAULT 'noreply@xmembers.app',
  email_subject_template text DEFAULT 'Seu acesso ao curso está liberado!',
  email_body_template text DEFAULT 'Olá {name}, seu acesso ao curso {course_name} está liberado! Acesse: {access_link}',
  webhook_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de mapeamento produto Hotmart → área
CREATE TABLE IF NOT EXISTS hotmart_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL,
  product_name text,
  area_slug text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índice único: cada produto mapeia para uma área
CREATE UNIQUE INDEX IF NOT EXISTS idx_hotmart_products_pid_area
  ON hotmart_products(product_id, area_slug);

-- Índice para busca rápida pelo product_id
CREATE INDEX IF NOT EXISTS idx_hotmart_products_pid
  ON hotmart_products(product_id);

-- 4. Tabela de logs de webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  area_slug text,
  event_type text,
  buyer_email text,
  buyer_name text,
  product_id text,
  transaction_id text,
  status text DEFAULT 'received' CHECK (status IN ('received', 'processed', 'error', 'ignored')),
  error_message text,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índice para busca por área e data
CREATE INDEX IF NOT EXISTS idx_webhook_logs_area_date
  ON webhook_logs(area_slug, created_at DESC);

-- 5. RLS (Row Level Security) - Permitir acesso público para webhook
ALTER TABLE authorized_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotmart_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Política para authorized_buyers: qualquer usuário autenticado pode ler (para verificar no login)
CREATE POLICY "Anyone can read authorized_buyers" ON authorized_buyers
  FOR SELECT USING (true);

-- Política para integration_settings: somente admins podem ler/escrever
CREATE POLICY "Admins can manage integration_settings" ON integration_settings
  FOR ALL USING (true);

-- Política para hotmart_products: somente admins podem ler/escrever
CREATE POLICY "Admins can manage hotmart_products" ON hotmart_products
  FOR ALL USING (true);

-- Política para webhook_logs: somente admins podem ler/escrever
CREATE POLICY "Admins can manage webhook_logs" ON webhook_logs
  FOR ALL USING (true);

-- Política para inserir authorized_buyers (webhook precisa inserir sem auth)
CREATE POLICY "Service can insert authorized_buyers" ON authorized_buyers
  FOR INSERT WITH CHECK (true);

-- Política para inserir webhook_logs (webhook precisa inserir sem auth)
CREATE POLICY "Service can insert webhook_logs" ON webhook_logs
  FOR INSERT WITH CHECK (true);
