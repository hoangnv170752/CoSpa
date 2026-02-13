# CoSpa API

FastAPI backend for CoSpa location discovery chat application.

## Features

- 🤖 **OpenAI GPT-4o Integration** - Using latest GPT-4o model (gpt-4o-2024-11-20)
- 🔍 **Semantic Search** - Qdrant vector database for intelligent location search
- 💬 **Chat API** - Conversational interface for location discovery
- 🗄️ **PostgreSQL** - Site data storage
- 🌐 **CORS Enabled** - Ready for frontend integration

## Setup

### 1. Install Dependencies

```bash
cd api
pip install -r requirements.txt
```

### 2. Environment Variables

Make sure your `.env` file in the root directory contains:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Qdrant
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_API_URL=your_qdrant_url

# PostgreSQL
POSTGRES_HOST=your_host
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database
POSTGRES_PORT=your_port
```

### 3. Run the API

```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or simply
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check

```bash
GET /
GET /health
```

### Chat Endpoint

```bash
POST /api/chat
```

**Request Body:**
```json
{
  "message": "Find me a coworking space in Hanoi",
  "history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you?"
    }
  ],
  "user_location": {
    "lat": 21.0285,
    "lng": 105.8542
  }
}
```

**Response:**
```json
{
  "reply": "I found some great coworking spaces in Hanoi for you...",
  "locations": [
    {
      "id": "uuid",
      "name": "Dreamplex Thai Ha",
      "type": "Coworking",
      "brand": "Dreamplex",
      "rating": 4.5,
      "review_count": 129,
      "address": "174 P. Thái Hà, Hanoi",
      "distance": "0.5 km",
      "lat": 21.0129657,
      "lng": 105.8203598,
      "phone_number": "+84 706 023 545",
      "link_google": "https://maps.google.com/...",
      "link_web": "https://dreamplex.co/",
      "thumbnail_url": "https://...",
      "amenities": ["wifi", "meeting rooms", "quiet space"],
      "isSponsored": false,
      "description": "Great coworking space in Hanoi"
    }
  ]
}
```

### Location Search

```bash
GET /api/locations/search?q=coworking+hanoi&limit=10
```

### Statistics

```bash
GET /api/stats
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Model Information

This API uses **GPT-4o** (model: `gpt-4o-2024-11-20`), which is OpenAI's latest multimodal model, also referred to as GPT-4.5 or GPT-5.1 in some contexts.

## Architecture

1. **User sends message** → FastAPI endpoint
2. **Semantic search** → Qdrant finds relevant locations using embeddings
3. **Context building** → System prompt includes found locations
4. **OpenAI GPT-4o** → Generates natural language response
5. **Response** → Reply + structured location data

## Development

```bash
# Run with auto-reload
uvicorn main:app --reload

# Run on different port
uvicorn main:app --port 3000

# Run with logs
uvicorn main:app --log-level debug
```

## Production Deployment

For production, consider:
- Using environment-specific CORS origins
- Adding rate limiting
- Implementing authentication
- Using a production ASGI server (Gunicorn + Uvicorn)
- Setting up proper logging and monitoring

```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
