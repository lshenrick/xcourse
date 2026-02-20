-- Multi-user: add owner_id to member_areas so each admin only sees their own areas
ALTER TABLE member_areas ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Set existing areas to the super admin (run once, replace with your user ID)
-- UPDATE member_areas SET owner_id = 'YOUR_SUPER_ADMIN_USER_ID' WHERE owner_id IS NULL;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_member_areas_owner_id ON member_areas(owner_id);
