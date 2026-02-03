-- =============================================================================
-- Science Based Body - Database Initialization Script
-- This runs automatically when PostgreSQL container starts for the first time
-- =============================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Grant permissions (if running as different user)
-- GRANT ALL PRIVILEGES ON DATABASE science_based_body TO sbb_user;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Science Based Body database initialized at %', NOW();
END $$;
