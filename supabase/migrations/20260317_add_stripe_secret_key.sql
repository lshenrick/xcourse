-- Add stripe_secret_key to integration_settings (per-area Stripe API key)
ALTER TABLE integration_settings
  ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT;
