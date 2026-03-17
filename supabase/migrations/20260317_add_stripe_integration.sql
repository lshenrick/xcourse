-- =============================================
-- Stripe Integration (coexisting with Hotmart)
-- =============================================

-- 1. Add payment_provider and stripe fields to integration_settings
ALTER TABLE integration_settings
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'hotmart' CHECK (payment_provider IN ('hotmart', 'stripe')),
  ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT;

-- 2. Add payment_provider and stripe fields to checkout_pages
ALTER TABLE checkout_pages
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'hotmart' CHECK (payment_provider IN ('hotmart', 'stripe')),
  ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT;

-- 3. Add stripe fields to authorized_buyers
ALTER TABLE authorized_buyers
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'hotmart' CHECK (payment_provider IN ('hotmart', 'stripe')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 4. Create stripe_products table
CREATE TABLE IF NOT EXISTS stripe_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id TEXT NOT NULL,
  product_name TEXT,
  area_slug TEXT NOT NULL,
  payment_type TEXT DEFAULT 'one_time' CHECK (payment_type IN ('one_time', 'recurring')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_products_price ON stripe_products(price_id);

ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage stripe_products" ON stripe_products
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  email TEXT NOT NULL,
  area_slug TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email_area ON subscriptions(email, area_slug);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read subscriptions" ON subscriptions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (true);
