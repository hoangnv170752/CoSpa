-- Migration: Add user info to reviews table
-- Description: Add user_name, user_email, and is_anonymous fields to reviews

ALTER TABLE reviews 
ADD COLUMN user_name VARCHAR(255),
ADD COLUMN user_email VARCHAR(255),
ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_is_anonymous ON reviews(is_anonymous);

-- Add comments
COMMENT ON COLUMN reviews.user_name IS 'User name from Clerk (for free users)';
COMMENT ON COLUMN reviews.user_email IS 'User email from Clerk (for free users)';
COMMENT ON COLUMN reviews.is_anonymous IS 'Whether user chose to be anonymous (premium feature)';
