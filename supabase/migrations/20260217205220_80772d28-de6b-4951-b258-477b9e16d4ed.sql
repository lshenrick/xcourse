CREATE POLICY "Admins can view all completions"
ON public.lesson_completions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));