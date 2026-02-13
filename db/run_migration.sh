#!/bin/bash
# Run users table migration

# Load environment variables
source ../.env

# Run migration
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -p $POSTGRES_PORT -f migrations/002_create_users_table.sql

echo "Migration completed!"
