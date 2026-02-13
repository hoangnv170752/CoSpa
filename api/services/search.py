"""
Search and location services
"""
import os
from typing import List, Optional
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
import math

# Initialize clients
qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_API_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)
embedding_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

COLLECTION_NAME = "cospa_sites"

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula (in km)"""
    R = 6371  # Earth radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def search_locations(query: str, limit: int = 5, user_location: Optional[dict] = None) -> List[dict]:
    """
    Search for locations using Qdrant vector search
    Filter by user location if provided
    """
    # Generate embedding for query
    query_vector = embedding_model.encode(query).tolist()
    
    # Search in Qdrant
    search_results = qdrant_client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=limit * 3 if user_location else limit  # Get more results for filtering
    )
    
    locations = []
    for result in search_results:
        loc = {
            'id': str(result.id),
            'score': result.score,
            **result.payload
        }
        locations.append(loc)
    
    # Filter by user location if provided
    if user_location and locations:
        user_lat = user_location.get('lat')
        user_lng = user_location.get('lng')
        
        if user_lat and user_lng:
            # Calculate distances and filter
            filtered_locations = []
            for loc in locations:
                if loc.get('lat') and loc.get('lng'):
                    distance = haversine_distance(user_lat, user_lng, loc['lat'], loc['lng'])
                    
                    # Only include locations within 30km
                    if distance <= 30:
                        loc['distance_km'] = distance
                        filtered_locations.append(loc)
            
            # Check if results are clustered (within 20km of each other)
            if len(filtered_locations) > 1:
                clustered = []
                base_loc = filtered_locations[0]
                clustered.append(base_loc)
                
                for loc in filtered_locations[1:]:
                    dist_to_base = haversine_distance(
                        base_loc['lat'], base_loc['lng'],
                        loc['lat'], loc['lng']
                    )
                    if dist_to_base <= 20:
                        clustered.append(loc)
                
                locations = clustered[:limit]
            else:
                locations = filtered_locations[:limit]
        else:
            locations = locations[:limit]
    else:
        locations = locations[:limit]
    
    return locations

def create_system_prompt(locations: List[dict], user_location: Optional[dict] = None) -> str:
    """Create system prompt with location context"""
    base_prompt = """Bạn là trợ lý AI chuyên về địa điểm ăn uống và không gian làm việc tại Việt Nam, đặc biệt phục vụ freelancer và sinh viên.

Nhiệm vụ của bạn:
1. Hiểu rõ nhu cầu của người dùng về địa điểm (cafe, coworking space, nhà hàng, v.v.)
2. Đề xuất các địa điểm phù hợp dựa trên kết quả tìm kiếm
3. Cung cấp thông tin chi tiết: địa chỉ, đánh giá, tiện ích
4. Nếu người dùng hỏi không rõ vị trí cụ thể, hãy hỏi lại để xác định (Hà Nội, TP.HCM, Đà Nẵng, v.v.)
5. Trả lời bằng tiếng Việt, thân thiện và hữu ích

"""
    
    if user_location:
        lat = user_location.get('lat')
        lng = user_location.get('lng')
        if lat and lng:
            base_prompt += f"\nVị trí người dùng: {lat}, {lng}\n"
    
    if locations:
        base_prompt += f"\nCó {len(locations)} địa điểm phù hợp:\n\n"
        for idx, loc in enumerate(locations, 1):
            base_prompt += f"{idx}. **{loc['name']}**\n"
            base_prompt += f"   Loại: {loc.get('type', 'N/A')}\n"
            base_prompt += f"   Địa chỉ: {loc.get('address', 'N/A')}\n"
            if loc.get('rating'):
                base_prompt += f"   Rating: {loc['rating']}/5\n"
            if loc.get('brand'):
                base_prompt += f"   Thương hiệu: {loc['brand']}\n"
            if loc.get('phone_number'):
                base_prompt += f"   SĐT: {loc['phone_number']}\n"
    
    return base_prompt
