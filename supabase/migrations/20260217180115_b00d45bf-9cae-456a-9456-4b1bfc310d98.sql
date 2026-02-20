
-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.comments
FOR DELETE
USING (user_id = auth.uid());

-- Allow users to update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
USING (user_id = auth.uid());

-- Allow users to delete their own replies
CREATE POLICY "Users can delete own replies"
ON public.comment_replies
FOR DELETE
USING (user_id = auth.uid());

-- Allow users to update their own replies
CREATE POLICY "Users can update own replies"
ON public.comment_replies
FOR UPDATE
USING (user_id = auth.uid());
