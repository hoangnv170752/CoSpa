-- Migration: Create user_saved_sites table
-- Description: Store user's saved/favorite locations

CREATE TABLE IF NOT EXISTS user_saved_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, site_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_saved_sites_user_id ON user_saved_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_sites_site_id ON user_saved_sites(site_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_sites_created_at ON user_saved_sites(created_at DESC);

-- Add comment
COMMENT ON TABLE user_saved_sites IS 'Stores user saved/favorite locations';
COMMENT ON COLUMN user_saved_sites.user_id IS 'Clerk user ID';
COMMENT ON COLUMN user_saved_sites.site_id IS 'Reference to sites table';
