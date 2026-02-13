#!/usr/bin/env python3
"""
Script to create all database tables for CoSpa application
Based on the database design in docs.md
"""

import psycopg
from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()

# Database configuration from .env
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST'),
    'user': os.getenv('POSTGRES_USER'),
    'password': os.getenv('POSTGRES_PASSWORD'),
    'database': os.getenv('POSTGRES_DB'),
    'port': int(os.getenv('POSTGRES_PORT'))
}

def create_all_tables(cursor):
    """Create all tables for CoSpa application"""
    
    # Enable UUID extension
    cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    print("✓ UUID extension enabled")
    
    # 1. Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(100) UNIQUE,
            full_name VARCHAR(255),
            avatar_url TEXT,
            phone_number VARCHAR(20),
            clerk_id VARCHAR(255) UNIQUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            last_login TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
    """)
    print("✓ Created table: users")
    
    # 2. Sites table (already exists, but ensure it has all fields)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sites (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(500),
            type VARCHAR(200),
            brand VARCHAR(500),
            old_address TEXT,
            new_address TEXT,
            num_address VARCHAR(500),
            ward VARCHAR(500),
            district VARCHAR(200),
            city VARCHAR(200),
            area VARCHAR(200),
            link_google TEXT,
            link_web TEXT,
            thumbnail_url TEXT,
            lat DECIMAL(10, 8),
            lng DECIMAL(11, 8),
            note TEXT,
            phone_number VARCHAR(50),
            rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
            review_count INTEGER DEFAULT 0,
            query_source VARCHAR(500),
            place_id VARCHAR(500) UNIQUE,
            data_id VARCHAR(500),
            cid VARCHAR(500),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE,
            is_verified BOOLEAN DEFAULT FALSE
        );
        
        CREATE INDEX IF NOT EXISTS idx_sites_location ON sites(lat, lng);
        CREATE INDEX IF NOT EXISTS idx_sites_type ON sites(type);
        CREATE INDEX IF NOT EXISTS idx_sites_city ON sites(city);
        CREATE INDEX IF NOT EXISTS idx_sites_place_id ON sites(place_id);
        CREATE INDEX IF NOT EXISTS idx_sites_rating ON sites(rating);
    """)
    print("✓ Created table: sites")
    
    # 3. Categories table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL UNIQUE,
            slug VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            icon VARCHAR(50),
            parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
            "order" INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE
        );
        
        CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
        CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
    """)
    print("✓ Created table: categories")
    
    # 4. Site_Categories table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS site_categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(site_id, category_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_site_categories_site ON site_categories(site_id);
        CREATE INDEX IF NOT EXISTS idx_site_categories_category ON site_categories(category_id);
    """)
    print("✓ Created table: site_categories")
    
    # 5. Reviews table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            images JSON,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE,
            UNIQUE(site_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_reviews_site ON reviews(site_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
    """)
    print("✓ Created table: reviews")
    
    # 6. Favorites table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, site_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_site ON favorites(site_id);
    """)
    print("✓ Created table: favorites")
    
    # 7. Check_Ins table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS check_ins (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            lat DECIMAL(10, 8),
            lng DECIMAL(11, 8),
            note TEXT,
            images JSON,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_checkins_user ON check_ins(user_id);
        CREATE INDEX IF NOT EXISTS idx_checkins_site ON check_ins(site_id);
        CREATE INDEX IF NOT EXISTS idx_checkins_created ON check_ins(created_at);
    """)
    print("✓ Created table: check_ins")
    
    # 8. Site_Images table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS site_images (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            caption VARCHAR(255),
            uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
            "order" INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE
        );
        
        CREATE INDEX IF NOT EXISTS idx_site_images_site ON site_images(site_id);
        CREATE INDEX IF NOT EXISTS idx_site_images_order ON site_images(site_id, "order");
    """)
    print("✓ Created table: site_images")
    
    # 9. Search_History table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS search_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            query VARCHAR(255) NOT NULL,
            lat DECIMAL(10, 8),
            lng DECIMAL(11, 8),
            filters JSON,
            results_count INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at);
    """)
    print("✓ Created table: search_history")
    
    # 10. Chat_Conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_conversations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE
        );
        
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_created ON chat_conversations(created_at);
    """)
    print("✓ Created table: chat_conversations")
    
    # 11. Chat_Messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            metadata JSON,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
    """)
    print("✓ Created table: chat_messages")
    
    # 12. Chat_Search_Results table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_search_results (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            rank INTEGER,
            relevance_score DECIMAL(5, 4),
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_chat_search_message ON chat_search_results(message_id);
        CREATE INDEX IF NOT EXISTS idx_chat_search_site ON chat_search_results(site_id);
    """)
    print("✓ Created table: chat_search_results")
    
    # 13. Advertising_Plans table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS advertising_plans (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            duration_days INTEGER NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            features JSON,
            max_sites INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_advertising_plans_active ON advertising_plans(is_active);
    """)
    print("✓ Created table: advertising_plans")
    
    # 14. Site_Advertisements table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS site_advertisements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            plan_id UUID NOT NULL REFERENCES advertising_plans(id) ON DELETE RESTRICT,
            owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP NOT NULL,
            status VARCHAR(20) NOT NULL,
            priority_boost INTEGER DEFAULT 0,
            is_featured BOOLEAN DEFAULT FALSE,
            impressions INTEGER DEFAULT 0,
            clicks INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_site_ads_site ON site_advertisements(site_id);
        CREATE INDEX IF NOT EXISTS idx_site_ads_status ON site_advertisements(status);
        CREATE INDEX IF NOT EXISTS idx_site_ads_dates ON site_advertisements(start_date, end_date);
        CREATE INDEX IF NOT EXISTS idx_site_ads_owner ON site_advertisements(owner_id);
    """)
    print("✓ Created table: site_advertisements")
    
    # 15. Payments table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            advertisement_id UUID REFERENCES site_advertisements(id) ON DELETE SET NULL,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'VND',
            payment_method VARCHAR(50),
            transaction_id VARCHAR(255) UNIQUE,
            status VARCHAR(20) NOT NULL,
            metadata JSON,
            paid_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
        CREATE INDEX IF NOT EXISTS idx_payments_advertisement ON payments(advertisement_id);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
        CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
    """)
    print("✓ Created table: payments")
    
    # 16. Contact_Requests table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contact_requests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            message TEXT,
            contact_info JSON,
            status VARCHAR(20) DEFAULT 'pending',
            fee_charged DECIMAL(10, 2),
            created_at TIMESTAMP DEFAULT NOW(),
            responded_at TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_contact_requests_user ON contact_requests(user_id);
        CREATE INDEX IF NOT EXISTS idx_contact_requests_site ON contact_requests(site_id);
        CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
    """)
    print("✓ Created table: contact_requests")
    
    # 17. Site_Notes table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS site_notes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
            session_id VARCHAR(255),
            title VARCHAR(255),
            content TEXT NOT NULL,
            tags JSON,
            visit_date DATE,
            rating_personal INTEGER CHECK (rating_personal >= 1 AND rating_personal <= 5),
            is_private BOOLEAN DEFAULT TRUE,
            images JSON,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_site_notes_user ON site_notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_site_notes_site ON site_notes(site_id);
        CREATE INDEX IF NOT EXISTS idx_site_notes_session ON site_notes(session_id);
        CREATE INDEX IF NOT EXISTS idx_site_notes_created ON site_notes(created_at);
    """)
    print("✓ Created table: site_notes")

def main():
    """Main function to create all tables"""
    
    print("=" * 60)
    print("CoSpa Database Table Creation")
    print("=" * 60)
    
    # Validate environment variables
    required_vars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'POSTGRES_PORT']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"\n✗ Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please make sure your .env file contains all required variables.")
        sys.exit(1)
    
    print(f"\nConnecting to database: {DB_CONFIG['database']} at {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    
    try:
        # Connect to PostgreSQL
        conn = psycopg.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            dbname=DB_CONFIG['database'],
            port=DB_CONFIG['port']
        )
        cursor = conn.cursor()
        
        print("✓ Connected to database successfully\n")
        
        # Create all tables
        print("Creating tables...")
        print("-" * 60)
        create_all_tables(cursor)
        conn.commit()
        
        # Get table count
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)
        table_count = cursor.fetchone()[0]
        
        print("-" * 60)
        print(f"\n✓ All tables created successfully!")
        print(f"Total tables in database: {table_count}")
        
        # List all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        
        print("\nTables in database:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
            count = cursor.fetchone()[0]
            print(f"  - {table[0]} ({count} rows)")
        
        print("\n" + "=" * 60)
        
        cursor.close()
        conn.close()
        
    except psycopg.Error as e:
        print(f"\n✗ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
