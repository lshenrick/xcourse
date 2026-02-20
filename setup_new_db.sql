-- ==========================================
-- SETUP COMPLETO DO BANCO DE DADOS
-- Projeto: Mestras - Area de Membros
-- ==========================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'super_admin');
CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. TABELAS PRINCIPAIS

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Course modules
CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'pt',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

-- Course lessons
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT,
  type TEXT NOT NULL DEFAULT 'video',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- Lesson content blocks
CREATE TABLE public.lesson_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_content_blocks ENABLE ROW LEVEL SECURITY;

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt',
  status comment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comment replies
CREATE TABLE public.comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt',
  status comment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

-- Comment likes
CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Lesson ratings
CREATE TABLE public.lesson_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  language TEXT NOT NULL DEFAULT 'pt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);
ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

-- Lesson completions
CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'pt',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

-- Access logs
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  language TEXT NOT NULL,
  email TEXT NOT NULL,
  device_type TEXT DEFAULT 'unknown',
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Page content (para conteudo dinamico futuro)
CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_value TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  language TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- 3. FUNCTIONS

-- has_role: verifica se usuario tem role (super_admin tem todas)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = _role OR role = 'super_admin')
  )
$$;

-- is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON public.lesson_content_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. RLS POLICIES

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins can delete roles" ON public.user_roles FOR DELETE USING (public.is_super_admin(auth.uid()));

-- Course modules: todos leem, admin edita
CREATE POLICY "Anyone can view modules" ON public.course_modules FOR SELECT USING (true);
CREATE POLICY "Admin can insert modules" ON public.course_modules FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update modules" ON public.course_modules FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete modules" ON public.course_modules FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Course lessons: todos leem, admin edita
CREATE POLICY "Anyone can view lessons" ON public.course_lessons FOR SELECT USING (true);
CREATE POLICY "Admin can insert lessons" ON public.course_lessons FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update lessons" ON public.course_lessons FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete lessons" ON public.course_lessons FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Lesson content blocks: todos leem, admin edita
CREATE POLICY "Anyone can view blocks" ON public.lesson_content_blocks FOR SELECT USING (true);
CREATE POLICY "Admin can insert blocks" ON public.lesson_content_blocks FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update blocks" ON public.lesson_content_blocks FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete blocks" ON public.lesson_content_blocks FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Comments
CREATE POLICY "Users see approved and own comments" ON public.comments FOR SELECT USING (
  status = 'approved' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Auth users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin can update comments" ON public.comments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admin can delete comments" ON public.comments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Comment replies
CREATE POLICY "Users see replies on visible comments" ON public.comment_replies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.comments c WHERE c.id = comment_id
    AND (c.status = 'approved' OR c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Auth users can create replies" ON public.comment_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.comment_replies FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin can update replies" ON public.comment_replies FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own replies" ON public.comment_replies FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admin can delete replies" ON public.comment_replies FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Comment likes
CREATE POLICY "Users can see likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own" ON public.comment_likes FOR DELETE USING (user_id = auth.uid());

-- Lesson ratings
CREATE POLICY "Users can see own ratings" ON public.lesson_ratings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all ratings" ON public.lesson_ratings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can rate" ON public.lesson_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON public.lesson_ratings FOR UPDATE USING (user_id = auth.uid());

-- Lesson completions
CREATE POLICY "Users see own completions" ON public.lesson_completions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all completions" ON public.lesson_completions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can complete lessons" ON public.lesson_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can uncomplete" ON public.lesson_completions FOR DELETE USING (user_id = auth.uid());

-- Access logs
CREATE POLICY "Admins can view access logs" ON public.access_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can log own access" ON public.access_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Page content
CREATE POLICY "Anyone can view page content" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "Admin can manage page content" ON public.page_content FOR ALL USING (public.has_role(auth.uid(), 'admin'));
