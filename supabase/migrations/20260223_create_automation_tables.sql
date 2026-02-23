-- Automation tables: AI training, email funnel, refund requests

-- AI Training per product (Q&A, retention, context)
CREATE TABLE IF NOT EXISTS public.ai_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_slug TEXT NOT NULL,
  ai_name TEXT DEFAULT 'Ana',
  ai_tone TEXT DEFAULT 'friendly',
  qa_pairs JSONB DEFAULT '[]'::jsonb,
  retention_attempt_1 TEXT DEFAULT '',
  retention_attempt_2 TEXT DEFAULT '',
  retention_final TEXT DEFAULT '',
  extra_context TEXT DEFAULT '',
  support_email TEXT DEFAULT '',
  google_refresh_token TEXT DEFAULT '',
  google_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(area_slug)
);

-- Email funnel templates (5 emails per product)
CREATE TABLE IF NOT EXISTS public.email_funnel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_slug TEXT NOT NULL,
  position INT NOT NULL CHECK (position BETWEEN 1 AND 5),
  subject TEXT DEFAULT '',
  body TEXT DEFAULT '',
  delay_hours INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(area_slug, position)
);

-- Email funnel log (track sent emails per buyer)
CREATE TABLE IF NOT EXISTS public.email_funnel_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT NOT NULL,
  area_slug TEXT NOT NULL,
  email_position INT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent'
);

-- Refund requests (simple: email + product)
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT NOT NULL,
  area_slug TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE public.ai_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_funnel_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_funnel_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (admin panel uses authenticated client)
CREATE POLICY "Authenticated users can manage ai_training" ON public.ai_training FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage email_funnel_templates" ON public.email_funnel_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage email_funnel_log" ON public.email_funnel_log FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage refund_requests" ON public.refund_requests FOR ALL USING (auth.role() = 'authenticated');
