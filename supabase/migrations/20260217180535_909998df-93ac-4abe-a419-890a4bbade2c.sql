
-- Add language column to comments, lesson_completions, lesson_ratings, comment_replies
ALTER TABLE public.comments ADD COLUMN language text NOT NULL DEFAULT 'pt';
ALTER TABLE public.lesson_completions ADD COLUMN language text NOT NULL DEFAULT 'pt';
ALTER TABLE public.lesson_ratings ADD COLUMN language text NOT NULL DEFAULT 'pt';
ALTER TABLE public.comment_replies ADD COLUMN language text NOT NULL DEFAULT 'pt';

-- Create access_logs table
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language text NOT NULL,
  email text NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access logs"
ON public.access_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can log own access"
ON public.access_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add super_admin to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
