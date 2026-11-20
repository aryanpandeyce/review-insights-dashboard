-- Create a dedicated test database for integration tests alongside the primary database
SELECT 'CREATE DATABASE review_insights_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'review_insights_test')\gexec
