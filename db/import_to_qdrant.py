#!/usr/bin/env python3
"""
Script to import sites data from PostgreSQL into Qdrant vector database
Uses sentence transformers to generate embeddings for semantic search
"""

import psycopg
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import os
import sys
from tqdm import tqdm

# Load environment variables
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST'),
    'user': os.getenv('POSTGRES_USER'),
    'password': os.getenv('POSTGRES_PASSWORD'),
    'database': os.getenv('POSTGRES_DB'),
    'port': int(os.getenv('POSTGRES_PORT'))
}

# Qdrant configuration
QDRANT_URL = os.getenv('QDRANT_API_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
COLLECTION_NAME = "cospa_sites"

# Embedding model
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"  # Supports Vietnamese

def create_site_text(site):
    """Create a searchable text representation of a site"""
    parts = []
    
    if site['name']:
        parts.append(f"Tên: {site['name']}")
    if site['type']:
        parts.append(f"Loại: {site['type']}")
    if site['brand']:
        parts.append(f"Thương hiệu: {site['brand']}")
    if site['city']:
        parts.append(f"Thành phố: {site['city']}")
    if site['ward']:
        parts.append(f"Phường: {site['ward']}")
    if site['area']:
        parts.append(f"Khu vực: {site['area']}")
    if site['new_address']:
        parts.append(f"Địa chỉ: {site['new_address']}")
    
    return " | ".join(parts)

def fetch_sites_from_postgres():
    """Fetch all active sites from PostgreSQL"""
    print("Connecting to PostgreSQL...")
    
    conn = psycopg.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        dbname=DB_CONFIG['database'],
        port=DB_CONFIG['port']
    )
    cursor = conn.cursor()
    
    query = """
        SELECT 
            id, name, type, brand, old_address, new_address, 
            num_address, ward, district, city, area, 
            link_google, link_web, thumbnail_url,
            lat, lng, note, phone_number, rating, review_count,
            query_source, place_id, data_id, cid
        FROM sites
        WHERE is_active = TRUE
        ORDER BY created_at DESC
    """
    
    cursor.execute(query)
    columns = [desc[0] for desc in cursor.description]
    
    sites = []
    for row in cursor.fetchall():
        site = dict(zip(columns, row))
        sites.append(site)
    
    cursor.close()
    conn.close()
    
    print(f"✓ Fetched {len(sites)} sites from PostgreSQL")
    return sites

def setup_qdrant_collection(qdrant_client, vector_size):
    """Create or recreate Qdrant collection"""
    
    # Check if collection exists
    collections = qdrant_client.get_collections().collections
    collection_names = [c.name for c in collections]
    
    if COLLECTION_NAME in collection_names:
        print(f"Collection '{COLLECTION_NAME}' already exists. Recreating...")
        qdrant_client.delete_collection(collection_name=COLLECTION_NAME)
    
    # Create collection
    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )
    
    print(f"✓ Created collection '{COLLECTION_NAME}' with vector size {vector_size}")

def upload_to_qdrant(qdrant_client, sites, model):
    """Generate embeddings and upload to Qdrant"""
    
    print(f"\nGenerating embeddings for {len(sites)} sites...")
    
    # Prepare texts for embedding
    texts = [create_site_text(site) for site in sites]
    
    # Generate embeddings in batches
    batch_size = 32
    all_embeddings = []
    
    for i in tqdm(range(0, len(texts), batch_size), desc="Embedding"):
        batch_texts = texts[i:i + batch_size]
        batch_embeddings = model.encode(batch_texts, show_progress_bar=False)
        all_embeddings.extend(batch_embeddings)
    
    print(f"✓ Generated {len(all_embeddings)} embeddings")
    
    # Setup collection with correct vector size
    vector_size = len(all_embeddings[0])
    setup_qdrant_collection(qdrant_client, vector_size)
    
    # Prepare points for upload
    points = []
    for idx, (site, embedding) in enumerate(zip(sites, all_embeddings)):
        # Convert Decimal to float for JSON serialization
        payload = {
            'id': str(site['id']),
            'name': site['name'],
            'type': site['type'],
            'brand': site['brand'],
            'city': site['city'],
            'ward': site['ward'],
            'area': site['area'],
            'address': site['new_address'] or site['old_address'],
            'lat': float(site['lat']) if site['lat'] else None,
            'lng': float(site['lng']) if site['lng'] else None,
            'rating': float(site['rating']) if site['rating'] else None,
            'review_count': site['review_count'],
            'phone_number': site['phone_number'],
            'link_google': site['link_google'],
            'link_web': site['link_web'],
            'thumbnail_url': site['thumbnail_url'],
            'place_id': site['place_id'],
            'search_text': create_site_text(site)
        }
        
        point = PointStruct(
            id=idx,
            vector=embedding.tolist(),
            payload=payload
        )
        points.append(point)
    
    # Upload in batches
    print("\nUploading to Qdrant...")
    batch_size = 100
    
    for i in tqdm(range(0, len(points), batch_size), desc="Uploading"):
        batch_points = points[i:i + batch_size]
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=batch_points
        )
    
    print(f"✓ Uploaded {len(points)} points to Qdrant")

def main():
    """Main function"""
    
    print("=" * 60)
    print("CoSpa - Import to Qdrant Vector Database")
    print("=" * 60)
    
    # Validate environment variables
    if not QDRANT_URL or not QDRANT_API_KEY:
        print("\n✗ Error: Missing QDRANT_API_URL or QDRANT_API_KEY in .env")
        sys.exit(1)
    
    try:
        # Initialize Qdrant client
        print(f"\nConnecting to Qdrant at {QDRANT_URL}...")
        qdrant_client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
        )
        
        # Test connection
        collections = qdrant_client.get_collections()
        print(f"✓ Connected to Qdrant. Existing collections: {len(collections.collections)}")
        
        # Load embedding model
        print(f"\nLoading embedding model: {MODEL_NAME}...")
        model = SentenceTransformer(MODEL_NAME)
        print(f"✓ Model loaded. Embedding dimension: {model.get_sentence_embedding_dimension()}")
        
        # Fetch sites from PostgreSQL
        sites = fetch_sites_from_postgres()
        
        if not sites:
            print("\n✗ No sites found in PostgreSQL")
            sys.exit(1)
        
        # Upload to Qdrant
        upload_to_qdrant(qdrant_client, sites, model)
        
        # Verify upload
        collection_info = qdrant_client.get_collection(collection_name=COLLECTION_NAME)
        print("\n" + "=" * 60)
        print("Import Summary")
        print("=" * 60)
        print(f"Collection: {COLLECTION_NAME}")
        print(f"Total points: {collection_info.points_count}")
        print(f"Vector size: {collection_info.config.params.vectors.size}")
        print("=" * 60)
        print("\n✓ Import completed successfully!")
        
        # Test search
        print("\nTesting search with query: 'coworking space Hanoi'...")
        test_query = "coworking space Hanoi"
        test_embedding = model.encode([test_query])[0]
        
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=test_embedding.tolist(),
            limit=3
        )
        
        print(f"\nTop 3 results:")
        for i, result in enumerate(search_results, 1):
            print(f"{i}. {result.payload['name']} ({result.payload['type']}) - Score: {result.score:.4f}")
            print(f"   {result.payload['address']}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
