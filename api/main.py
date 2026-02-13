"""
FastAPI backend for CoSpa - Location discovery chat API
Integrates with OpenAI GPT-4o (latest), Qdrant vector search, and PostgreSQL
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from openai import OpenAI
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
import psycopg

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="CoSpa API",
    description="Location discovery chat API with semantic search",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_API_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)
embedding_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# Database config
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST'),
    'user': os.getenv('POSTGRES_USER'),
    'password': os.getenv('POSTGRES_PASSWORD'),
    'database': os.getenv('POSTGRES_DB'),
    'port': int(os.getenv('POSTGRES_PORT'))
}

COLLECTION_NAME = "cospa_sites"

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
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
    distance: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    phone_number: Optional[str]
    link_google: Optional[str]
    link_web: Optional[str]
    thumbnail_url: Optional[str]
    amenities: List[str] = []
    isSponsored: bool = False
    description: Optional[str]

class ChatResponse(BaseModel):
    reply: str
    locations: List[LocationResult]

# Helper functions
def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula (in km)"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth radius in kilometers
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)
    
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

def search_locations(query: str, limit: int = 5, user_location: Optional[dict] = None) -> List[dict]:
    """Search locations using Qdrant vector search with optional location filtering"""
    try:
        # Generate embedding for query
        query_embedding = embedding_model.encode([query])[0]
        
        # Search in Qdrant with more results initially to filter by location
        search_limit = limit * 5 if user_location else limit * 2
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding.tolist(),
            limit=search_limit
        )
        
        locations = []
        for result in search_results:
            payload = result.payload
            
            # Skip if missing coordinates
            if not payload.get('lat') or not payload.get('lng'):
                continue
                
            location_data = {
                'id': payload.get('id'),
                'name': payload.get('name'),
                'type': payload.get('type'),
                'brand': payload.get('brand'),
                'rating': payload.get('rating'),
                'review_count': payload.get('review_count'),
                'address': payload.get('address'),
                'city': payload.get('city'),
                'lat': payload.get('lat'),
                'lng': payload.get('lng'),
                'phone_number': payload.get('phone_number'),
                'link_google': payload.get('link_google'),
                'link_web': payload.get('link_web'),
                'thumbnail_url': payload.get('thumbnail_url'),
                'place_id': payload.get('place_id'),
                'score': result.score,
                'distance_from_user': None
            }
            
            # Filter by user location if provided
            if user_location and user_location.get('lat') and user_location.get('lng'):
                distance = calculate_distance(
                    user_location['lat'], user_location['lng'],
                    location_data['lat'], location_data['lng']
                )
                location_data['distance_from_user'] = distance
                
                # Only include locations within 30km radius
                if distance <= 30:
                    locations.append(location_data)
            else:
                locations.append(location_data)
        
        # Additional validation: ensure locations are not too far apart
        if len(locations) > 1:
            # Use first location as reference (highest semantic match)
            reference = locations[0]
            filtered_locations = [reference]
            
            for loc in locations[1:]:
                distance_from_ref = calculate_distance(
                    reference['lat'], reference['lng'],
                    loc['lat'], loc['lng']
                )
                
                # Only include if within 20km of the first result
                # This prevents mixing different cities
                if distance_from_ref <= 20:
                    filtered_locations.append(loc)
                    
                if len(filtered_locations) >= limit:
                    break
            
            return filtered_locations
        
        # Return top results after filtering
        return locations[:limit]
    except Exception as e:
        print(f"Error searching locations: {e}")
        return []

def create_system_prompt(locations: List[dict], user_location: Optional[dict] = None) -> str:
    """Create system prompt with location context and user location"""
    
    base_prompt = """Bạn là CoSpa - trợ lý ảo chuyên nghiệp trong lĩnh vực F&B (Food & Beverage) và bất động sản văn phòng tại Việt Nam.

🎯 NHIỆM VỤ CHÍNH:
Hỗ trợ freelancer, học sinh, sinh viên tìm kiếm không gian làm việc và học tập phù hợp với nhu cầu cá nhân.

👤 ĐỐI TƯỢNG PHỤC VỤ:
- Freelancer cần không gian làm việc linh hoạt
- Học sinh, sinh viên cần chỗ học tập yên tĩnh
- Người làm việc remote cần môi trường chuyên nghiệp
- Nhóm nhỏ cần không gian họp/làm việc nhóm

💡 CHUYÊN MÔN CỦA BẠN:
1. **F&B Knowledge:**
   - Cafe, quán cà phê phù hợp làm việc/học tập
   - Coworking space với đầy đủ tiện nghi
   - Đánh giá chất lượng wifi, ổ cắm điện, độ ồn
   - Giá cả phù hợp với sinh viên/freelancer

2. **Bất động sản văn phòng:**
   - Không gian làm việc chung (coworking)
   - Văn phòng chia sẻ, phòng họp
   - Vị trí thuận tiện, giao thông
   - Chi phí hợp lý theo từng khu vực

3. **Tư vấn cá nhân hóa:**
   - Phân tích nhu cầu cụ thể của người dùng
   - Đề xuất địa điểm phù hợp với budget
   - So sánh ưu/nhược điểm các lựa chọn
   - Gợi ý thời gian tốt nhất để đến

📋 CÁCH TRẢ LỜI:
- Thân thiện, gần gũi như một người bạn tư vấn
- Trả lời bằng ngôn ngữ người dùng sử dụng (Tiếng Việt hoặc English)
- Cung cấp thông tin chi tiết: rating, giá, wifi, độ ồn, ổ cắm
- Đề xuất 2-3 lựa chọn tốt nhất với lý do rõ ràng
- Không dùng markdown formatting trong câu trả lời
- Luôn hỏi thêm nếu cần làm rõ nhu cầu

🎯 TIÊU CHÍ ƯU TIÊN KHI TƯ VẤN:
1. Wifi mạnh, ổn định (quan trọng nhất cho freelancer)
2. Ổ cắm điện đầy đủ
3. Không gian yên tĩnh (cho học tập)
4. Giá cả phải chăng (phù hợp sinh viên)
5. Vị trí thuận tiện, dễ tìm
6. Giờ mở cửa linh hoạt
7. Đồ uống/thức ăn chất lượng, giá hợp lý

⚠️ LƯU Ý QUAN TRỌNG:
- **BẮT BUỘC hỏi rõ địa chỉ** nếu người dùng chưa nói cụ thể:
  + Phường/Xã nào?
  + Quận/Huyện nào?
  + Tỉnh/Thành phố nào?
  Ví dụ: "Bạn muốn tìm ở phường nào, quận nào ở Hà Nội?"
  
- Luôn hỏi về budget và khu vực ưu tiên
- Phân biệt nhu cầu làm việc cá nhân vs nhóm
- Gợi ý thời gian ít đông để có chỗ ngồi tốt
- Cảnh báo nếu địa điểm thường đông vào giờ cao điểm
- Đề xuất địa điểm với toạ độ (lat, lng) để người dùng dễ tìm trên bản đồ

📍 VỀ VỊ TRÍ:
- Nếu người dùng chỉ nói "Hà Nội" hoặc "Sài Gòn" → Hỏi thêm quận/phường cụ thể
- Nếu người dùng nói "gần đây" → Hỏi vị trí hiện tại hoặc khu vực họ thường ở
- Luôn đề cập đến địa chỉ chi tiết (phường, quận) khi giới thiệu địa điểm
- CHỈ giới thiệu địa điểm trong cùng thành phố với người dùng (không được lẫn Hà Nội và TP.HCM)
"""
    
    # Add user location context if available
    if user_location and user_location.get('lat') and user_location.get('lng'):
        base_prompt += f"\n\n📍 VỊ TRÍ NGƯỜI DÙNG:\nToạ độ hiện tại: {user_location['lat']}, {user_location['lng']}\n"
    
    if locations:
        base_prompt += "\n\n📍 CÁC ĐỊA ĐIỂM LIÊN QUAN:\n"
        for i, loc in enumerate(locations, 1):
            rating_str = f"{loc['rating']}/5" if loc['rating'] else "N/A"
            base_prompt += f"{i}. {loc['name']} ({loc['type']}) - Rating: {rating_str}\n"
            base_prompt += f"   Địa chỉ: {loc['address']}\n"
            if loc.get('lat') and loc.get('lng'):
                base_prompt += f"   Toạ độ: {loc['lat']}, {loc['lng']}\n"
            if loc.get('brand'):
                base_prompt += f"   Thương hiệu: {loc['brand']}\n"
            if loc.get('phone_number'):
                base_prompt += f"   SĐT: {loc['phone_number']}\n"
    
    return base_prompt

# API Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "CoSpa API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "openai": "connected" if os.getenv("OPENAI_API_KEY") else "not configured",
        "qdrant": "connected" if os.getenv("QDRANT_API_KEY") else "not configured",
        "postgres": "configured" if all(DB_CONFIG.values()) else "not configured"
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint with location search
    Uses OpenAI GPT-4o (latest version) for intelligent conversation
    """
    try:
        # Search for relevant locations with user location filter
        locations = search_locations(request.message, limit=5, user_location=request.user_location)
        
        # Create system prompt with location context and user location
        system_prompt = create_system_prompt(locations, user_location=request.user_location)
        
        # Prepare messages for OpenAI
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history
        for msg in request.history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        # Call OpenAI API with latest GPT-4o model
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # Latest GPT-4o model (automatically uses newest version)
            messages=messages,
            temperature=0.7,
            max_tokens=800  # Increased for more detailed responses
        )
        
        reply = response.choices[0].message.content
        
        # Format locations for response
        location_results = []
        for loc in locations:
            # Generate mock amenities based on type
            amenities = []
            if loc['type'] in ['Cafe', 'cafe']:
                amenities = ['wifi', 'coffee', 'seating']
            elif loc['type'] in ['Coworking', 'coworking space']:
                amenities = ['wifi', 'meeting rooms', 'quiet space']
            
            # Calculate distance (mock for now)
            distance = f"{round(loc.get('score', 0) * 10, 1)} km"
            
            location_results.append(LocationResult(
                id=loc['id'],
                name=loc['name'],
                type=loc['type'],
                brand=loc.get('brand'),
                rating=loc.get('rating'),
                review_count=loc.get('review_count'),
                address=loc['address'],
                distance=distance,
                lat=loc.get('lat'),
                lng=loc.get('lng'),
                phone_number=loc.get('phone_number'),
                link_google=loc.get('link_google'),
                link_web=loc.get('link_web'),
                thumbnail_url=loc.get('thumbnail_url') or f"https://picsum.photos/400/300?random={hash(loc['id']) % 1000}",
                amenities=amenities,
                isSponsored=False,  # Can be enhanced with actual sponsored data
                description=f"Great {loc['type'].lower()} in {loc['address'].split(',')[-1].strip() if ',' in loc['address'] else 'Vietnam'}"
            ))
        
        return ChatResponse(
            reply=reply,
            locations=location_results
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/locations/search")
async def search_locations_endpoint(q: str, limit: int = 10):
    """Direct location search endpoint"""
    try:
        locations = search_locations(q, limit=limit)
        return {"results": locations, "count": len(locations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    """Get database statistics"""
    try:
        # Get Qdrant stats
        collection_info = qdrant_client.get_collection(collection_name=COLLECTION_NAME)
        
        # Get PostgreSQL stats
        conn = psycopg.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM sites WHERE is_active = TRUE")
        total_sites = cursor.fetchone()[0]
        
        cursor.execute("SELECT city, COUNT(*) FROM sites WHERE is_active = TRUE GROUP BY city ORDER BY COUNT(*) DESC LIMIT 5")
        top_cities = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "total_sites": total_sites,
            "vector_db_points": collection_info.points_count,
            "top_cities": [{"city": city, "count": count} for city, count in top_cities]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
