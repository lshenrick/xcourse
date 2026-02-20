
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create comment_status enum
CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status comment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 6. Comment replies table
CREATE TABLE public.comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status comment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

-- 7. Comment likes table
CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 8. Lesson ratings table
CREATE TABLE public.lesson_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);
ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

-- 9. Lesson completions table
CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

-- 10. Security definer function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 11. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ RLS POLICIES ============

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- Comments: users see approved + own pending/rejected; admin sees all
CREATE POLICY "Users see approved and own comments" ON public.comments FOR SELECT USING (
  status = 'approved' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Auth users can create comments" ON public.comments FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Admin can update comments" ON public.comments FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admin can delete comments" ON public.comments FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);

-- Comment replies
CREATE POLICY "Users see replies on visible comments" ON public.comment_replies FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.comments c WHERE c.id = comment_id
    AND (c.status = 'approved' OR c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Auth users can create replies" ON public.comment_replies FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Admin can update replies" ON public.comment_replies FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admin can delete replies" ON public.comment_replies FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);

-- Comment likes
CREATE POLICY "Users can see likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own" ON public.comment_likes FOR DELETE USING (user_id = auth.uid());

-- Lesson ratings
CREATE POLICY "Users can see own ratings" ON public.lesson_ratings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can rate" ON public.lesson_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON public.lesson_ratings FOR UPDATE USING (user_id = auth.uid());

-- Lesson completions
CREATE POLICY "Users see own completions" ON public.lesson_completions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can complete lessons" ON public.lesson_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can uncomplete" ON public.lesson_completions FOR DELETE USING (user_id = auth.uid());
