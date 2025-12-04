-- Item Price Cache Table
-- This table caches item prices from the Albion Online API
-- to reduce API calls and stay within rate limits

-- Drop existing table if it has issues
DROP TABLE IF EXISTS item_price_cache CASCADE;

-- Create the table with correct schema
CREATE TABLE item_price_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  location TEXT NOT NULL,
  quality INTEGER NOT NULL DEFAULT 1,
  sell_price_min NUMERIC NOT NULL DEFAULT 0,
  sell_price_min_date TIMESTAMP WITH TIME ZONE,
  sell_price_max NUMERIC NOT NULL DEFAULT 0,
  sell_price_max_date TIMESTAMP WITH TIME ZONE,
  buy_price_min NUMERIC NOT NULL DEFAULT 0,
  buy_price_min_date TIMESTAMP WITH TIME ZONE,
  buy_price_max NUMERIC NOT NULL DEFAULT 0,
  buy_price_max_date TIMESTAMP WITH TIME ZONE,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT item_price_cache_unique_item_location UNIQUE(item_id, location)
);

-- Disable RLS (Row Level Security) for simple use case
ALTER TABLE item_price_cache DISABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_item_price_cache_lookup 
ON item_price_cache(item_id, location);

-- Create index for cache expiry checks
CREATE INDEX idx_item_price_cache_cached_at 
ON item_price_cache(cached_at);

-- Grant permissions (adjust if you use RLS)
-- GRANT ALL ON item_price_cache TO anon, authenticated;
