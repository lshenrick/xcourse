CREATE POLICY "Admins can view all ratings"
ON public.lesson_ratings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));