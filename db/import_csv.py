#!/usr/bin/env python3
"""
Script to import data from HaNoi.csv into PostgreSQL database
"""

import csv
import psycopg
from dotenv import load_dotenv
import os
import sys
from decimal import Decimal

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

CSV_FILE = 'data/HaNoi.csv'

def create_tables(cursor):
    """Create the sites table if it doesn't exist"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS sites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_sites_location ON sites(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_sites_type ON sites(type);
    CREATE INDEX IF NOT EXISTS idx_sites_city ON sites(city);
    CREATE INDEX IF NOT EXISTS idx_sites_place_id ON sites(place_id);
    CREATE INDEX IF NOT EXISTS idx_sites_rating ON sites(rating);
    """
    
    cursor.execute(create_table_sql)
    print("✓ Tables and indexes created successfully")

def parse_decimal(value):
    """Parse decimal value from string, handling empty values"""
    if not value or value.strip() == '':
        return None
    try:
        # Replace comma with dot for decimal separator
        value = value.replace(',', '.')
        return Decimal(value)
    except:
        return None

def parse_integer(value):
    """Parse integer value from string, handling empty values"""
    if not value or value.strip() == '':
        return None
    try:
        return int(value)
    except:
        return None

def clean_string(value):
    """Clean string value, return None for empty strings"""
    if not value or value.strip() == '':
        return None
    return value.strip()

def import_csv_data(cursor, csv_file):
    """Import data from CSV file into the database"""
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        # Read CSV with semicolon delimiter
        csv_reader = csv.DictReader(file, delimiter=';')
        
        rows_to_insert = []
        skipped_rows = 0
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is header
            try:
                # Map CSV columns to database columns
                # Handle BOM in first column name
                name_col = '\ufeffTên địa điểm' if '\ufeffTên địa điểm' in row else 'Tên địa điểm'
                data = (
                    clean_string(row.get(name_col)),
                    clean_string(row.get('Loại hình')),
                    clean_string(row.get('Thương hiệu/Chuỗi')),
                    clean_string(row.get('Địa chỉ cũ')),
                    clean_string(row.get('Địa chỉ mới')),
                    clean_string(row.get('Số nhà / Đường')),
                    clean_string(row.get('Phường')),
                    None,  # district - not in CSV, will extract from ward if needed
                    clean_string(row.get('Tỉnh/Thành phố')),
                    clean_string(row.get('Khu vực')),
                    clean_string(row.get('Link Google Maps')),
                    clean_string(row.get('Website/MXH')),
                    clean_string(row.get('Ảnh (URL)')),
                    parse_decimal(row.get('Vĩ độ')),
                    parse_decimal(row.get('Kinh độ')),
                    clean_string(row.get('Ghi chú')),
                    clean_string(row.get('SĐT')),
                    parse_decimal(row.get('Điểm rating')),
                    parse_integer(row.get('Số review')),
                    clean_string(row.get('Query nguồn')),
                    clean_string(row.get('Place ID')),
                    clean_string(row.get('Data ID')),
                    clean_string(row.get('CID'))
                )
                
                rows_to_insert.append(data)
                
            except Exception as e:
                print(f"⚠ Warning: Skipped row {row_num} due to error: {e}")
                skipped_rows += 1
                continue
        
        # Bulk insert for better performance
        if rows_to_insert:
            insert_sql = """
                INSERT INTO sites (
                    name, type, brand, old_address, new_address, num_address,
                    ward, district, city, area, link_google, link_web, thumbnail_url,
                    lat, lng, note, phone_number, rating, review_count,
                    query_source, place_id, data_id, cid
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (place_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    type = EXCLUDED.type,
                    brand = EXCLUDED.brand,
                    rating = EXCLUDED.rating,
                    review_count = EXCLUDED.review_count,
                    updated_at = NOW()
            """
            
            cursor.executemany(insert_sql, rows_to_insert)
            
            print(f"✓ Successfully imported {len(rows_to_insert)} records")
            if skipped_rows > 0:
                print(f"⚠ Skipped {skipped_rows} rows due to errors")
        else:
            print("✗ No valid data to import")

def main():
    """Main function to run the import process"""
    
    print("=" * 60)
    print("CoSpa CSV Import Tool")
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
        
        # Create tables
        print("Creating tables and indexes...")
        create_tables(cursor)
        conn.commit()
        
        # Import CSV data
        print(f"\nImporting data from {CSV_FILE}...")
        import_csv_data(cursor, CSV_FILE)
        conn.commit()
        
        # Get statistics
        cursor.execute("SELECT COUNT(*) FROM sites")
        total_sites = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM sites WHERE rating IS NOT NULL")
        sites_with_rating = cursor.fetchone()[0]
        
        print("\n" + "=" * 60)
        print("Import Summary")
        print("=" * 60)
        print(f"Total sites in database: {total_sites}")
        print(f"Sites with ratings: {sites_with_rating}")
        print("=" * 60)
        print("\n✓ Import completed successfully!")
        
        cursor.close()
        conn.close()
        
    except psycopg.Error as e:
        print(f"\n✗ Database error: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"\n✗ Error: CSV file '{CSV_FILE}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
