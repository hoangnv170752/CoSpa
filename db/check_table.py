#!/usr/bin/env python3
"""
Script to check if sites table exists and show sample data
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
    print("CoSpa Database Check Tool")
    print("=" * 60)
    
    try:
        conn = psycopg.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            dbname=DB_CONFIG['database'],
            port=DB_CONFIG['port']
        )
        cursor = conn.cursor()
        
        print(f"\n✓ Connected to database: {DB_CONFIG['database']}\n")
        
        # Check current schema
        cursor.execute("SELECT current_schema();")
        current_schema = cursor.fetchone()[0]
        print(f"Current schema: {current_schema}")
        
        # List all schemas
        cursor.execute("SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;")
        schemas = cursor.fetchall()
        print(f"\nAvailable schemas:")
        for schema in schemas:
            print(f"  - {schema[0]}")
        
        # Check if sites table exists in current schema
        cursor.execute("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'sites'
            ORDER BY table_schema;
        """)
        tables = cursor.fetchall()
        
        if tables:
            print(f"\n✓ Found 'sites' table in:")
            for schema, table in tables:
                print(f"  - Schema: {schema}, Table: {table}")
                
                # Get row count
                cursor.execute(f'SELECT COUNT(*) FROM "{schema}".sites;')
                count = cursor.fetchone()[0]
                print(f"    Row count: {count}")
                
                # Show sample data
                if count > 0:
                    cursor.execute(f'SELECT id, name, type, city, lat, lng FROM "{schema}".sites LIMIT 3;')
                    rows = cursor.fetchall()
                    print(f"\n    Sample data:")
                    for row in rows:
                        print(f"      - {row[1]} ({row[2]}) in {row[3]}")
        else:
            print("\n✗ No 'sites' table found in any schema")
        
        # List all tables in public schema
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        public_tables = cursor.fetchall()
        
        print(f"\n\nAll tables in 'public' schema:")
        if public_tables:
            for table in public_tables:
                cursor.execute(f'SELECT COUNT(*) FROM public.{table[0]};')
                count = cursor.fetchone()[0]
                print(f"  - {table[0]} ({count} rows)")
        else:
            print("  (no tables)")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        
    except psycopg.Error as e:
        print(f"\n✗ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
