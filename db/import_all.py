#!/usr/bin/env python3
"""
Script to import all CSV files from db/data directory into PostgreSQL database
Excludes HaNoi.csv which has already been imported
"""

import csv
import psycopg
from dotenv import load_dotenv
import os
import sys
from decimal import Decimal
from pathlib import Path

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

DATA_DIR = 'data'
EXCLUDE_FILES = ['HaNoi.csv']  # Already imported

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

def import_csv_file(cursor, csv_file_path):
    """Import data from a single CSV file into the database"""
    
    file_name = os.path.basename(csv_file_path)
    print(f"\n{'='*60}")
    print(f"Importing: {file_name}")
    print('='*60)
    
    with open(csv_file_path, 'r', encoding='utf-8') as file:
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
            
            return len(rows_to_insert), skipped_rows
        else:
            print("✗ No valid data to import")
            return 0, skipped_rows

def get_csv_files():
    """Get list of CSV files to import (excluding specified files)"""
    data_path = Path(DATA_DIR)
    csv_files = []
    
    for csv_file in data_path.glob('*.csv'):
        if csv_file.name not in EXCLUDE_FILES:
            csv_files.append(csv_file)
    
    return sorted(csv_files)

def main():
    """Main function to run the import process"""
    
    print("=" * 60)
    print("CoSpa Bulk CSV Import Tool")
    print("=" * 60)
    
    # Validate environment variables
    required_vars = ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'POSTGRES_PORT']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"\n✗ Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please make sure your .env file contains all required variables.")
        sys.exit(1)
    
    # Get list of CSV files
    csv_files = get_csv_files()
    
    if not csv_files:
        print(f"\n✗ No CSV files found in {DATA_DIR}/ directory (excluding {', '.join(EXCLUDE_FILES)})")
        sys.exit(1)
    
    print(f"\nFound {len(csv_files)} CSV file(s) to import:")
    for csv_file in csv_files:
        print(f"  - {csv_file.name}")
    
    print(f"\nExcluding: {', '.join(EXCLUDE_FILES)}")
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
        
        print("✓ Connected to database successfully")
        
        # Import each CSV file
        total_imported = 0
        total_skipped = 0
        
        for csv_file in csv_files:
            imported, skipped = import_csv_file(cursor, csv_file)
            total_imported += imported
            total_skipped += skipped
            conn.commit()
        
        # Get final statistics
        cursor.execute("SELECT COUNT(*) FROM sites")
        total_sites = cursor.fetchone()[0]
        
        cursor.execute("SELECT city, COUNT(*) FROM sites WHERE city IS NOT NULL GROUP BY city ORDER BY COUNT(*) DESC")
        cities = cursor.fetchall()
        
        cursor.execute("SELECT COUNT(*) FROM sites WHERE rating IS NOT NULL")
        sites_with_rating = cursor.fetchone()[0]
        
        print("\n" + "=" * 60)
        print("Import Summary")
        print("=" * 60)
        print(f"Files processed: {len(csv_files)}")
        print(f"Records imported: {total_imported}")
        if total_skipped > 0:
            print(f"Records skipped: {total_skipped}")
        print(f"\nTotal sites in database: {total_sites}")
        print(f"Sites with ratings: {sites_with_rating}")
        
        print(f"\nSites by city:")
        for city, count in cities[:10]:  # Show top 10 cities
            print(f"  - {city}: {count}")
        
        print("=" * 60)
        print("\n✓ All imports completed successfully!")
        
        cursor.close()
        conn.close()
        
    except psycopg.Error as e:
        print(f"\n✗ Database error: {e}")
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"\n✗ File error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
