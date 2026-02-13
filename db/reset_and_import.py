#!/usr/bin/env python3
"""
Script to drop existing table and reimport data
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

def main():
    print("=" * 60)
    print("CoSpa Database Reset Tool")
    print("=" * 60)
    
    # Validate environment variables
    required_vars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'POSTGRES_PORT']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"\n✗ Error: Missing required environment variables: {', '.join(missing_vars)}")
        sys.exit(1)
    
    print(f"\nConnecting to database: {DB_CONFIG['database']} at {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    
    try:
        conn = psycopg.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            dbname=DB_CONFIG['database'],
            port=DB_CONFIG['port']
        )
        cursor = conn.cursor()
        
        print("✓ Connected to database successfully\n")
        
        # Drop existing table
        print("Dropping existing sites table...")
        cursor.execute("DROP TABLE IF EXISTS sites CASCADE;")
        conn.commit()
        print("✓ Table dropped successfully\n")
        
        cursor.close()
        conn.close()
        
        print("=" * 60)
        print("✓ Database reset completed!")
        print("=" * 60)
        print("\nNow run: python import_csv.py")
        
    except psycopg.Error as e:
        print(f"\n✗ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
