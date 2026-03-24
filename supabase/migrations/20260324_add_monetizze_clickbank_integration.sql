-- =============================================
-- Monetizze & ClickBank Integration
-- =============================================

-- 1. Create monetizze_products table
CREATE TABLE IF NOT EXISTS monetizze_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_name TEXT,
  area_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monetizze_products_product ON monetizze_products(product_id);

ALTER TABLE monetizze_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage monetizze_products" ON monetizze_products
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. Create clickbank_products table
CREATE TABLE IF NOT EXISTS clickbank_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_no TEXT NOT NULL,
  product_name TEXT,
  area_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clickbank_products_item ON clickbank_products(item_no);

ALTER TABLE clickbank_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage clickbank_products" ON clickbank_products
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Add monetizze/clickbank token fields to integration_settings
ALTER TABLE integration_settings
  ADD COLUMN IF NOT EXISTS monetizze_token TEXT,
  ADD COLUMN IF NOT EXISTS clickbank_secret_key TEXT;

-- 4. Drop old CHECK constraints and add new ones with all providers
-- payment_provider on integration_settings
ALTER TABLE integration_settings DROP CONSTRAINT IF EXISTS integration_settings_payment_provider_check;
ALTER TABLE integration_settings ADD CONSTRAINT integration_settings_payment_provider_check
  CHECK (payment_provider IN ('hotmart', 'stripe', 'monetizze', 'clickbank'));

-- payment_provider on authorized_buyers
ALTER TABLE authorized_buyers DROP CONSTRAINT IF EXISTS authorized_buyers_payment_provider_check;
ALTER TABLE authorized_buyers ADD CONSTRAINT authorized_buyers_payment_provider_check
  CHECK (payment_provider IN ('hotmart', 'stripe', 'monetizze', 'clickbank'));

-- payment_provider on checkout_pages
ALTER TABLE checkout_pages DROP CONSTRAINT IF EXISTS checkout_pages_payment_provider_check;
ALTER TABLE checkout_pages ADD CONSTRAINT checkout_pages_payment_provider_check
  CHECK (payment_provider IN ('hotmart', 'stripe', 'monetizze', 'clickbank'));

-- 5. Add monetizze/clickbank specific fields to authorized_buyers
ALTER TABLE authorized_buyers
  ADD COLUMN IF NOT EXISTS monetizze_transaction TEXT,
  ADD COLUMN IF NOT EXISTS monetizze_product_id TEXT,
  ADD COLUMN IF NOT EXISTS clickbank_receipt TEXT,
  ADD COLUMN IF NOT EXISTS clickbank_item_no TEXT;
