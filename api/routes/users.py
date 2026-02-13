"""
User management routes
"""
from fastapi import APIRouter, HTTPException
import psycopg
from models.schemas import UserSync
from config.database import DB_CONFIG

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/sync")
async def sync_user(user_data: UserSync):
    """
    Sync Clerk user data to PostgreSQL
    Creates or updates user record
    """
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Upsert user data
                cur.execute("""
                    INSERT INTO users (clerk_id, email, full_name, avatar_url, updated_at)
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (clerk_id) 
                    DO UPDATE SET 
                        email = EXCLUDED.email,
                        full_name = EXCLUDED.full_name,
                        avatar_url = EXCLUDED.avatar_url,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id, clerk_id, email
                """, (user_data.clerk_id, user_data.email, user_data.full_name, user_data.avatar_url))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "status": "success",
                    "user_id": str(result[0]),
                    "clerk_id": result[1],
                    "email": result[2]
                }
    except Exception as e:
        print(f"Error syncing user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync user: {str(e)}")
