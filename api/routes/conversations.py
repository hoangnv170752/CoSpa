"""
Conversation management routes
"""
from fastapi import APIRouter, HTTPException
import psycopg
from models.schemas import ConversationCreate
from config.database import DB_CONFIG

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.post("")
async def create_conversation(data: ConversationCreate):
    """
    Create new conversation
    Limit: Max 3 active conversations per user
    """
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Check conversation limit
                cur.execute("""
                    SELECT COUNT(*) FROM chat_conversations 
                    WHERE user_id = %s AND is_active = TRUE
                """, (data.user_id,))
                count = cur.fetchone()[0]
                
                if count >= 3:
                    raise HTTPException(
                        status_code=400, 
                        detail="Bạn đã đạt giới hạn 3 cuộc hội thoại. Vui lòng xóa cuộc hội thoại cũ để tạo mới."
                    )
                
                # Create conversation
                cur.execute("""
                    INSERT INTO chat_conversations (user_id, title)
                    VALUES (%s, %s)
                    RETURNING id, created_at
                """, (data.user_id, data.title or "Cuộc hội thoại mới"))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "conversation_id": str(result[0]),
                    "created_at": result[1].isoformat()
                }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
async def get_user_conversations(user_id: str):
    """Get all active conversations for a user"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, title, created_at, updated_at,
                           (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = chat_conversations.id) as message_count
                    FROM chat_conversations
                    WHERE user_id = %s AND is_active = TRUE
                    ORDER BY updated_at DESC
                """, (user_id,))
                
                conversations = []
                for row in cur.fetchall():
                    conversations.append({
                        "id": str(row[0]),
                        "title": row[1],
                        "created_at": row[2].isoformat(),
                        "updated_at": row[3].isoformat(),
                        "message_count": row[4]
                    })
                
                return {"conversations": conversations}
    except Exception as e:
        print(f"Error fetching conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{conversation_id}")
async def update_conversation(conversation_id: str, data: dict):
    """Update conversation title"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE chat_conversations 
                    SET title = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING title
                """, (data.get('title'), conversation_id))
                result = cur.fetchone()
                conn.commit()
                
                return {"status": "success", "title": result[0] if result else None}
    except Exception as e:
        print(f"Error updating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """Get all messages for a conversation"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Get messages
                cur.execute("""
                    SELECT id, role, content, created_at
                    FROM chat_messages
                    WHERE conversation_id = %s
                    ORDER BY created_at ASC
                """, (conversation_id,))
                
                messages = []
                for row in cur.fetchall():
                    message_id = str(row[0])
                    
                    # Get related locations for this message
                    cur.execute("""
                        SELECT s.id, s.name, s.new_address, s.lat, s.lng, 
                               s.rating, s.thumbnail_url, s.note
                        FROM chat_search_results csr
                        JOIN sites s ON csr.site_id = s.id
                        WHERE csr.message_id = %s
                        ORDER BY csr.rank
                    """, (message_id,))
                    
                    locations = []
                    for loc_row in cur.fetchall():
                        locations.append({
                            "id": str(loc_row[0]),
                            "name": loc_row[1],
                            "address": loc_row[2] or "",
                            "coordinates": {
                                "lat": float(loc_row[3]),
                                "lng": float(loc_row[4])
                            },
                            "rating": float(loc_row[5]) if loc_row[5] else 0,
                            "imageUrl": loc_row[6] or "",
                            "description": loc_row[7] or ""
                        })
                    
                    messages.append({
                        "id": message_id,
                        "role": row[1],
                        "content": row[2],
                        "timestamp": int(row[3].timestamp() * 1000),
                        "relatedLocations": locations if locations else None
                    })
                
                return {"messages": messages}
    except Exception as e:
        print(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Soft delete a conversation"""
    try:
        with psycopg.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE chat_conversations 
                    SET is_active = FALSE 
                    WHERE id = %s
                """, (conversation_id,))
                conn.commit()
                
                return {"status": "success"}
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
