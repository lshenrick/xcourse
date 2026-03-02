CREATE TABLE IF NOT EXISTS public.checkout_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_email TEXT NOT NULL,
  obfuscated_email TEXT NOT NULL,
  name TEXT,
  checkout_slug TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_checkout_leads_obfuscated_email
  ON checkout_leads(lower(obfuscated_email), created_at DESC);

CREATE INDEX idx_checkout_leads_real_email
  ON checkout_leads(lower(real_email), created_at DESC);

CREATE INDEX idx_checkout_leads_created_at
  ON checkout_leads(created_at);

ALTER TABLE public.checkout_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read checkout_leads" ON checkout_leads
  FOR SELECT USING (auth.role() = 'authenticated');
