"""
Chat routes with OpenAI integration
"""
from fastapi import APIRouter, HTTPException
import psycopg
import os
from openai import OpenAI
from models.schemas import ChatRequest, ChatResponse, LocationResult
from config.database import DB_CONFIG
from services.search import search_locations, create_system_prompt

router = APIRouter(prefix="/api", tags=["chat"])

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint with location search and conversation tracking
    Uses OpenAI GPT-4o (latest version) for intelligent conversation
    Limit: Max 10 messages per conversation
    """
    try:
        conversation_id = request.conversation_id
        
        # Check message limit if conversation_id provided
        if conversation_id:
            with psycopg.connect(**DB_CONFIG) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT COUNT(*) FROM chat_messages 
                        WHERE conversation_id = %s
                    """, (conversation_id,))
                    message_count = cur.fetchone()[0]
                    
                    if message_count >= 10:
                        raise HTTPException(
                            status_code=400,
                            detail="Cuộc hội thoại đã đạt giới hạn 10 tin nhắn. Vui lòng tạo cuộc hội thoại mới."
                        )
        
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
        
        # Save messages to database if conversation_id provided
        if conversation_id:
            with psycopg.connect(**DB_CONFIG) as conn:
                with conn.cursor() as cur:
                    # Save user message
                    cur.execute("""
                        INSERT INTO chat_messages (conversation_id, role, content)
                        VALUES (%s, 'user', %s)
                        RETURNING id
                    """, (conversation_id, request.message))
                    user_message_id = cur.fetchone()[0]
                    
                    # Save assistant message
                    cur.execute("""
                        INSERT INTO chat_messages (conversation_id, role, content)
                        VALUES (%s, 'assistant', %s)
                        RETURNING id
                    """, (conversation_id, reply))
                    assistant_message_id = cur.fetchone()[0]
                    
                    # Save search results linked to assistant message
                    for idx, loc in enumerate(locations):
                        cur.execute("""
                            INSERT INTO chat_search_results (message_id, site_id, rank, relevance_score)
                            VALUES (%s, %s, %s, %s)
                        """, (assistant_message_id, loc['id'], idx + 1, loc.get('score', 0.0)))
                    
                    # Update conversation updated_at
                    cur.execute("""
                        UPDATE chat_conversations 
                        SET updated_at = CURRENT_TIMESTAMP 
                        WHERE id = %s
                    """, (conversation_id,))
                    
                    conn.commit()
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
