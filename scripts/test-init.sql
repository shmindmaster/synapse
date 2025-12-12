-- Test Database Initialization Script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');

