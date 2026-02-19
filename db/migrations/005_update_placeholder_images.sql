-- Migration: Update placeholder image URLs to CoSpa fallback image
-- Description: Replace any via.placeholder.com or picsum.photos URLs with the new fallback image

UPDATE sites 
SET thumbnail_url = 'https://cdn.xanhsm.com/2025/02/13cba011-cafe-sang-sai-gon-4.jpg'
WHERE thumbnail_url LIKE '%via.placeholder%' 
   OR thumbnail_url LIKE '%picsum.photos%'
   OR thumbnail_url IS NULL
   OR thumbnail_url = '';

-- Add comment
COMMENT ON COLUMN sites.thumbnail_url IS 'Thumbnail image URL, defaults to https://cdn.xanhsm.com/2025/02/13cba011-cafe-sang-sai-gon-4.jpg if empty';
