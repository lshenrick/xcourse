-- Fix: Add missing DELETE and UPDATE RLS policies for authorized_buyers
-- Without these, admins cannot delete or update buyer status from the frontend

-- Allow authenticated users to delete authorized_buyers
CREATE POLICY "Authenticated users can delete authorized_buyers" ON authorized_buyers
  FOR DELETE USING (true);

-- Allow authenticated users to update authorized_buyers
CREATE POLICY "Authenticated users can update authorized_buyers" ON authorized_buyers
  FOR UPDATE USING (true) WITH CHECK (true);
