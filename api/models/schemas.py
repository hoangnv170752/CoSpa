"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel
from typing import List, Optional

class UserSync(BaseModel):
    clerk_id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ConversationCreate(BaseModel):
    user_id: str
    title: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None  # For authenticated users
    history: Optional[List[ChatMessage]] = []
    user_location: Optional[dict] = None

class LocationResult(BaseModel):
    id: str
    name: str
    type: str
    brand: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    address: str
    distance: str
    lat: Optional[float]
    lng: Optional[float]
    phone_number: Optional[str]
    link_google: Optional[str]
    link_web: Optional[str]
    thumbnail_url: Optional[str]
    amenities: List[str]
    isSponsored: bool
    description: str

class ChatResponse(BaseModel):
    reply: str
    locations: List[LocationResult]
