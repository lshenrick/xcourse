-- Create checkout_pages table for Hotmart Checkout Page Builder
CREATE TABLE public.checkout_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  offer_code TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  custom_css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_pages ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read active checkout pages (for the public checkout route)
CREATE POLICY "Anyone can view active checkout pages"
  ON public.checkout_pages
  FOR SELECT
  USING (active = true);

-- Admins can view all their own checkout pages (including inactive)
CREATE POLICY "Admins can view own checkout pages"
  ON public.checkout_pages
  FOR SELECT
  USING (owner_id = auth.uid());

-- Admins can create checkout pages
CREATE POLICY "Admins can create checkout pages"
  ON public.checkout_pages
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Admins can update their own checkout pages
CREATE POLICY "Admins can update own checkout pages"
  ON public.checkout_pages
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Admins can delete their own checkout pages
CREATE POLICY "Admins can delete own checkout pages"
  ON public.checkout_pages
  FOR DELETE
  USING (owner_id = auth.uid());

-- Index for fast public page lookup
CREATE INDEX idx_checkout_pages_slug_active ON public.checkout_pages(slug) WHERE active = true;
