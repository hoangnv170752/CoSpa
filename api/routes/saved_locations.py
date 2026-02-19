from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import psycopg
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

router = APIRouter()

DB_CONFIG = {
    "dbname": os.getenv("POSTGRES_DB", "cospa"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", ""),
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", "5432"),
}

class SaveLocationRequest(BaseModel):
    user_id: str
    site_id: str

class SavedLocation(BaseModel):
    id: str
    name: str
    address: str
    rating: float
    imageUrl: str
    coordinates: dict
    savedAt: str
    type: str

class SavedLocationsResponse(BaseModel):
    locations: List[SavedLocation]

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

@router.get("/{user_id}")
async def get_saved_locations(user_id: str):
    """Get all saved locations for a user"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Get UUID from clerk_id
                user_uuid = get_user_uuid(cur, user_id)
                if not user_uuid:
                    return SavedLocationsResponse(locations=[])

                # Query saved locations from favorites table
                cur.execute("""
                    SELECT
                        s.id,
                        s.name,
                        s.new_address,
                        s.rating,
                        s.thumbnail_url,
                        s.lat,
                        s.lng,
                        f.created_at,
                        s.type
                    FROM favorites f
                    JOIN sites s ON f.site_id = s.id
                    WHERE f.user_id = %s
                    ORDER BY f.created_at DESC
                """, (user_uuid,))

                locations = []
                for row in cur.fetchall():
                    locations.append(SavedLocation(
                        id=str(row[0]),
                        name=row[1],
                        address=row[2] or "",
                        rating=float(row[3]) if row[3] else 0.0,
                        imageUrl=row[4] or "https://cdn.xanhsm.com/2025/02/13cba011-cafe-sang-sai-gon-4.jpg",
                        coordinates={
                            "lat": float(row[5]) if row[5] else 0.0,
                            "lng": float(row[6]) if row[6] else 0.0
                        },
                        savedAt=row[7].isoformat() if row[7] else datetime.now().isoformat(),
                        type=row[8] or "Cafe"
                    ))
                
                return SavedLocationsResponse(locations=locations)
                
    except Exception as e:
        print(f"Error fetching saved locations: {e}")
        # Return empty list instead of error for better UX
        return SavedLocationsResponse(locations=[])

@router.post("/save")
async def save_location(request: SaveLocationRequest):
    """Save a location for a user"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Get UUID from clerk_id
                user_uuid = get_user_uuid(cur, request.user_id)
                if not user_uuid:
                    raise HTTPException(status_code=404, detail="User not found")

                # Check if already saved
                cur.execute("""
                    SELECT id FROM favorites
                    WHERE user_id = %s AND site_id = %s
                """, (user_uuid, request.site_id))

                if cur.fetchone():
                    return {"message": "Location already saved", "success": True}

                # Insert new saved location
                cur.execute("""
                    INSERT INTO favorites (user_id, site_id, created_at)
                    VALUES (%s, %s, NOW())
                """, (user_uuid, request.site_id))
                
                conn.commit()
                return {"message": "Location saved successfully", "success": True}
                
    except Exception as e:
        print(f"Error saving location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}/{site_id}")
async def remove_saved_location(user_id: str, site_id: str):
    """Remove a saved location"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Get UUID from clerk_id
                user_uuid = get_user_uuid(cur, user_id)
                if not user_uuid:
                    raise HTTPException(status_code=404, detail="User not found")

                cur.execute("""
                    DELETE FROM favorites
                    WHERE user_id = %s AND site_id = %s
                """, (user_uuid, site_id))
                
                conn.commit()
                return {"message": "Location removed successfully", "success": True}
                
    except Exception as e:
        print(f"Error removing saved location: {e}")
        raise HTTPException(status_code=500, detail=str(e))
