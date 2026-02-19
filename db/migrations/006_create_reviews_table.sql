-- Migration: Create reviews table
-- Description: Store user reviews for sites with rating and comments

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    images TEXT[], -- Array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(site_id, user_id) -- One review per user per site
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_site_id ON reviews(site_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_active ON reviews(is_active);

-- Add comments
COMMENT ON TABLE reviews IS 'User reviews for sites with ratings and comments';
COMMENT ON COLUMN reviews.site_id IS 'Reference to sites table';
COMMENT ON COLUMN reviews.user_id IS 'Reference to users table';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.comment IS 'User review comment';
COMMENT ON COLUMN reviews.images IS 'Array of image URLs uploaded by user';
COMMENT ON COLUMN reviews.is_active IS 'Soft delete flag';
