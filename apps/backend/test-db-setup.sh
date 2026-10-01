#!/usr/bin/env bash
# Apply migrations to the test database.
# Reads DATABASE_URL from .env.test.

set -e

export $(grep -v '^#' .env.test | xargs)

echo "Setting up test database: $DATABASE_URL"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
echo "Test database schema is up to date."
