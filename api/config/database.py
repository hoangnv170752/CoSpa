"""
Database configuration and utilities
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Database config
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST'),
    'user': os.getenv('POSTGRES_USER'),
    'password': os.getenv('POSTGRES_PASSWORD'),
    'dbname': os.getenv('POSTGRES_DB'),  # psycopg uses 'dbname' not 'database'
    'port': int(os.getenv('POSTGRES_PORT'))
}
