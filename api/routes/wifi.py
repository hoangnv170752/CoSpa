from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import psycopg
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

DB_CONFIG = {
    "dbname": os.getenv("POSTGRES_DB", "cospa"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", ""),
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", "5432"),
}

class WiFiScanRequest(BaseModel):
    user_id: str
    location_id: Optional[str] = None

class WiFiNetwork(BaseModel):
    ssid: str
    signal: int
    security: str
    password: Optional[str] = None
    available: bool
    location_name: Optional[str] = None

class WiFiScanResponse(BaseModel):
    networks: List[WiFiNetwork]

@router.post("/scan")
async def scan_wifi(request: WiFiScanRequest):
    """
    Scan for WiFi networks and return passwords for premium users
    This is a demo endpoint - in production, you would:
    1. Verify user's premium status via Clerk
    2. Get user's location
    3. Query database for WiFi passwords of nearby cafes/coworking spaces
    """
    try:
        # In production, verify premium status from Clerk
        # For now, we'll return demo data
        
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Query WiFi passwords from sites table
                # Assuming you have wifi_ssid and wifi_password columns
                cur.execute("""
                    SELECT 
                        name,
                        wifi_ssid,
                        wifi_password,
                        rating
                    FROM sites
                    WHERE wifi_ssid IS NOT NULL 
                    AND wifi_password IS NOT NULL
                    LIMIT 20
                """)
                
                networks = []
                for row in cur.fetchall():
                    location_name = row[0]
                    ssid = row[1]
                    password = row[2]
                    rating = row[3] if row[3] else 4.0
                    
                    # Calculate signal based on rating (demo logic)
                    signal = min(int(rating * 20), 100)
                    
                    networks.append(WiFiNetwork(
                        ssid=ssid,
                        signal=signal,
                        security="WPA2",
                        password=password,
                        available=True,
                        location_name=location_name
                    ))
                
                # If no data in DB, return demo data
                if not networks:
                    networks = [
                        WiFiNetwork(
                            ssid="Highlands Coffee",
                            signal=85,
                            security="WPA2",
                            password="highland2024",
                            available=True,
                            location_name="Highlands Coffee - Hoàn Kiếm"
                        ),
                        WiFiNetwork(
                            ssid="The Coffee House",
                            signal=72,
                            security="WPA2",
                            password="coffee@123",
                            available=True,
                            location_name="The Coffee House - Hai Bà Trưng"
                        ),
                        WiFiNetwork(
                            ssid="Starbucks_Guest",
                            signal=65,
                            security="WPA2",
                            password="starbucks2024",
                            available=True,
                            location_name="Starbucks - Tràng Tiền"
                        ),
                        WiFiNetwork(
                            ssid="Phuc Long Tea",
                            signal=58,
                            security="WPA2",
                            password="phuclong@wifi",
                            available=True,
                            location_name="Phúc Long - Đống Đa"
                        ),
                        WiFiNetwork(
                            ssid="Cong Caphe",
                            signal=45,
                            security="WPA2",
                            password="congcaphe123",
                            available=True,
                            location_name="Cộng Cà Phê - Ba Đình"
                        ),
                    ]
                
                return WiFiScanResponse(networks=networks)
                
    except Exception as e:
        print(f"Error scanning WiFi: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/location/{location_id}")
async def get_location_wifi(location_id: str):
    """Get WiFi credentials for a specific location"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        name,
                        wifi_ssid,
                        wifi_password
                    FROM sites
                    WHERE id = %s
                    AND wifi_ssid IS NOT NULL
                """, (location_id,))
                
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="WiFi information not available")
                
                return {
                    "location_name": row[0],
                    "ssid": row[1],
                    "password": row[2]
                }
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting WiFi info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
