"""
Clerk authentication utilities for FastAPI
"""
import jwt
import os
from fastapi import HTTPException, Header
from typing import Optional

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

def verify_clerk_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify Clerk JWT token from Authorization header
    Returns decoded token payload with user info
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        
        # Decode JWT token
        # Note: In production, you should fetch and cache Clerk's public keys
        # For now, we'll skip verification for development
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        return decoded
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_user_from_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extract user ID from Clerk token
    Returns None if no token provided (for optional auth)
    """
    if not authorization:
        return None
    
    try:
        decoded = verify_clerk_token(authorization)
        return decoded.get("sub")  # Clerk user ID
    except HTTPException:
        return None
