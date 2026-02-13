"""
FastAPI backend for CoSpa - Location discovery chat API
Integrates with OpenAI GPT-4o (latest), Qdrant vector search, and PostgreSQL
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Import routes
from routes.users import router as users_router
from routes.conversations import router as conversations_router
from routes.chat import router as chat_router

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

# Include routers
app.include_router(users_router)
app.include_router(conversations_router)
app.include_router(chat_router)

# Health check endpoints
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
        "postgres": "configured" if os.getenv("POSTGRES_HOST") else "not configured"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
