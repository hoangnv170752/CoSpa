from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import psycopg
from datetime import datetime
from config.database import DB_CONFIG

router = APIRouter()

class Review(BaseModel):
    id: str
    site_id: str
    user_id: str
    rating: int
    comment: str
    images: List[str] = []
    created_at: str
    updated_at: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    is_anonymous: bool = False

class CreateReviewRequest(BaseModel):
    site_id: str
    user_id: str
    rating: int
    comment: str
    images: List[str] = []
    is_anonymous: bool = False
    user_name: Optional[str] = None
    user_email: Optional[str] = None

class ReviewsResponse(BaseModel):
    reviews: List[Review]
    total: int
    user_has_reviewed: bool

def get_user_uuid(cur, user_id: str) -> str | None:
    """Get user UUID - accepts either UUID directly or clerk_id"""
    # First try to find by UUID (id column)
    cur.execute("SELECT id FROM users WHERE id::text = %s", (user_id,))
    row = cur.fetchone()
    if row:
        return str(row[0])

    # If not found, try by clerk_id
    cur.execute("SELECT id FROM users WHERE clerk_id = %s", (user_id,))
    row = cur.fetchone()
    return str(row[0]) if row else None

@router.get("/{site_id}")
async def get_site_reviews(site_id: str, user_id: Optional[str] = None):
    """Get all reviews for a site"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Get user UUID if provided
                user_uuid = None
                if user_id:
                    user_uuid = get_user_uuid(cur, user_id)

                # Query reviews
                cur.execute("""
                    SELECT 
                        r.id,
                        r.site_id,
                        r.user_id,
                        r.rating,
                        r.comment,
                        r.images,
                        r.created_at,
                        r.updated_at,
                        r.user_name,
                        r.user_email,
                        r.is_anonymous
                    FROM reviews r
                    WHERE r.site_id = %s AND r.is_active = TRUE
                    ORDER BY r.created_at DESC
                """, (site_id,))

                reviews = []
                user_has_reviewed = False
                for row in cur.fetchall():
                    review = Review(
                        id=str(row[0]),
                        site_id=str(row[1]),
                        user_id=str(row[2]),
                        rating=row[3],
                        comment=row[4],
                        images=row[5] or [],
                        created_at=row[6].isoformat() if row[6] else datetime.now().isoformat(),
                        updated_at=row[7].isoformat() if row[7] else datetime.now().isoformat(),
                        user_name=row[8],
                        user_email=row[9],
                        is_anonymous=row[10] if row[10] is not None else False
                    )
                    reviews.append(review)
                    
                    # Check if current user has already reviewed
                    if user_uuid and str(row[2]) == user_uuid:
                        user_has_reviewed = True

                return ReviewsResponse(
                    reviews=reviews,
                    total=len(reviews),
                    user_has_reviewed=user_has_reviewed
                )
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create")
async def create_review(request: CreateReviewRequest):
    """Create a new review"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Get user UUID
                user_uuid = get_user_uuid(cur, request.user_id)
                if not user_uuid:
                    raise HTTPException(status_code=404, detail="User not found")

                # Check if user already reviewed this site
                cur.execute("""
                    SELECT id FROM reviews
                    WHERE site_id = %s AND user_id = %s
                """, (request.site_id, user_uuid))

                if cur.fetchone():
                    raise HTTPException(
                        status_code=400, 
                        detail="Bạn đã đánh giá địa điểm này rồi. Mỗi người dùng chỉ được đánh giá 1 lần."
                    )

                # Validate rating
                if request.rating < 1 or request.rating > 5:
                    raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

                # Insert review
                cur.execute("""
                    INSERT INTO reviews (site_id, user_id, rating, comment, images, user_name, user_email, is_anonymous, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id
                """, (request.site_id, user_uuid, request.rating, request.comment, request.images, request.user_name, request.user_email, request.is_anonymous))
                
                review_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    "message": "Review created successfully",
                    "success": True,
                    "review_id": str(review_id)
                }
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{review_id}")
async def delete_review(review_id: str, user_id: str):
    """Delete a review (soft delete)"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Get user UUID
                user_uuid = get_user_uuid(cur, user_id)
                if not user_uuid:
                    raise HTTPException(status_code=404, detail="User not found")

                # Soft delete review (only if user owns it)
                cur.execute("""
                    UPDATE reviews
                    SET is_active = FALSE, updated_at = NOW()
                    WHERE id = %s AND user_id = %s
                """, (review_id, user_uuid))
                
                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Review not found or unauthorized")
                
                conn.commit()
                return {"message": "Review deleted successfully", "success": True}
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
