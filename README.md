# CoSpa - AI-Powered Workspace Discovery Platform

CoSpa is an intelligent location discovery platform that helps users find the perfect workspaces, cafes, and coworking spaces across Vietnam. Built with AI-powered chat interface and semantic search capabilities.

## 🌟 Features

### Core Features
- **AI Chat Assistant**: Natural language conversation to discover locations based on user preferences
- **Semantic Search**: Powered by Qdrant vector database for intelligent location matching
- **Interactive Map**: Real-time location visualization with Leaflet
- **Saved Locations**: Bookmark favorite workspaces for quick access
- **User Reviews**: Community-driven reviews with rating system
- **City Navigation**: Quick filters for major cities (Hanoi, Quang Ninh, Hai Phong, Ho Chi Minh City)

### User Tiers
- **Free Tier**:
  - 3 conversation limit
  - 10 messages per conversation
  - 1 review per location
  - Public reviews (name & email displayed)
  
- **Premium Tier** (99,000đ one-time):
  - Unlimited conversations
  - Unlimited messages
  - Anonymous reviews
  - Priority support
  - Early access to new features

### Review System
- Star rating (1-5)
- Text comments about quality, WiFi, staff attitude
- User information display for free users
- Anonymous option for premium users
- One review per user per location

## 🛠️ Tech Stack

### Frontend
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **Clerk** for authentication
- **Lucide React** for icons

### Backend
- **FastAPI** (Python 3.11+)
- **PostgreSQL** for data storage
- **Qdrant** for vector search
- **OpenAI GPT-4** for chat completions
- **psycopg** for database connections

### Infrastructure
- **Database**: PostgreSQL with UUID primary keys
- **Vector DB**: Qdrant for semantic search
- **Authentication**: Clerk
- **Deployment**: VPS with automated backups

## 📁 Project Structure

```
CoSpa/
├── api/                    # FastAPI backend
│   ├── routes/            # API endpoints
│   │   ├── chat.py        # Chat & location search
│   │   ├── conversations.py
│   │   ├── reviews.py     # Review system
│   │   ├── saved_locations.py
│   │   └── users.py
│   ├── config/            # Configuration
│   ├── models/            # Pydantic models
│   └── services/          # Business logic
├── web/                   # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
├── db/                    # Database
│   └── migrations/        # SQL migrations
└── scripts/               # Utility scripts
    └── backup_database.sh # Automated backup
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Qdrant instance
- OpenAI API key
- Clerk account

### Backend Setup

1. **Install dependencies**:
```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment** (`.env`):
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=cospa
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

OPENAI_API_KEY=your_openai_key
QDRANT_API_KEY=your_qdrant_key
QDRANT_URL=your_qdrant_url

CLERK_SECRET_KEY=your_clerk_secret
```

3. **Run migrations**:
```bash
psql -U postgres -d cospa -f db/migrations/001_initial_schema.sql
psql -U postgres -d cospa -f db/migrations/006_create_reviews_table.sql
psql -U postgres -d cospa -f db/migrations/007_add_user_info_to_reviews.sql
```

4. **Start server**:
```bash
python main.py
# Server runs on http://localhost:8000
```

### Frontend Setup

1. **Install dependencies**:
```bash
cd web
npm install
```

2. **Configure environment** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

3. **Start development server**:
```bash
npm run dev
# App runs on http://localhost:5173
```

## 📊 Database Schema

### Key Tables
- **users**: User profiles from Clerk
- **sites**: Workspace/cafe locations with coordinates
- **chat_conversations**: User conversation threads
- **chat_messages**: Individual messages with AI responses
- **saved_locations**: User bookmarked locations
- **reviews**: User reviews with ratings and comments

## 🎯 Key Implementations

### 1. Conversation Limits
- Free users: Max 3 conversations, 10 messages each
- Backend validation with clear error messages
- UI prompts to upgrade when limits reached

### 2. Review System
- One review per user per location (database constraint)
- Free users: Name & email displayed
- Premium users: Optional anonymous reviews
- Star ratings with text comments

### 3. Semantic Search
- Qdrant vector embeddings for location matching
- Natural language query understanding
- Context-aware location recommendations

### 4. Database Backups
- Automated daily backups via cron
- 3-day retention policy
- Compressed archives with timestamps

## 🔐 Security Features
- Clerk authentication integration
- User UUID-based access control
- SQL injection prevention with parameterized queries
- CORS configuration for API security

## 💳 Payment Integration
- QR code payment options (International & Vietnam Banking)
- Manual verification process
- 24-hour upgrade turnaround

## 📝 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🤝 Contributing

This is a personal project for the Amazon Nova AI Hackathon. For inquiries:
- **Zalo**: 0354530616
- **Email**: hoang.nv.ral@gmail.com

## 📄 License

All rights reserved © 2026 CoSpa

## 🏆 Hackathon Submission

Built for Amazon Nova AI Hackathon - Agentic AI Category
- Multi-agent architecture for location discovery
- Amazon Nova integration for embeddings and chat
- Enterprise-ready solution for media companies

---

**Note**: This application is currently in beta and actively accepting feedback for improvements.
