#!/bin/bash
set -e

# Read database password from secret file if available
if [ -f /run/secrets/db_password ]; then
    export POSTGRES_PASSWORD=$(cat /run/secrets/db_password)
fi

echo "Waiting for database to be ready..."
# Wait for postgres to be ready
until python -c "
import psycopg
import os
password = os.environ.get('POSTGRES_PASSWORD', 'postgres')
psycopg.connect(
    host=os.environ.get('POSTGRES_HOST', 'postgres'),
    dbname=os.environ.get('POSTGRES_DB', 'pokemon_battle'),
    user=os.environ.get('POSTGRES_USER', 'postgres'),
    password=password
)
" 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is ready!"

python manage.py migrate --noinput
python manage.py seed_all

# Build MkDocs site (drf_to_mkdoc is a plugin that runs during build)
if [ -f "mkdocs.yml" ]; then
    mkdocs build --site-dir site || echo "Warning: MkDocs build failed, continuing anyway..."
    echo "Documentation build completed"
else
    echo "Warning: mkdocs.yml not found, skipping documentation build"
fi

echo "Starting server..."
exec "$@"
