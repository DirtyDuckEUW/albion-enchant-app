-- Item Price Cache Table
-- This table caches item prices from the Albion Online API
-- to reduce API calls and stay within rate limits

CREATE TABLE IF NOT EXISTS item_price_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  location TEXT NOT NULL,
  quality INTEGER NOT NULL DEFAULT 0,
  sell_price_min NUMERIC NOT NULL DEFAULT 0,
  sell_price_min_date TIMESTAMP WITH TIME ZONE,
  sell_price_max NUMERIC NOT NULL DEFAULT 0,
  sell_price_max_date TIMESTAMP WITH TIME ZONE,
  buy_price_min NUMERIC NOT NULL DEFAULT 0,
  buy_price_min_date TIMESTAMP WITH TIME ZONE,
  buy_price_max NUMERIC NOT NULL DEFAULT 0,
  buy_price_max_date TIMESTAMP WITH TIME ZONE,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, location)
);

-- Disable RLS (Row Level Security) for simple use case
ALTER TABLE item_price_cache DISABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_item_price_cache_lookup 
ON item_price_cache(item_id, location);

-- Create index for cache expiry checks
CREATE INDEX IF NOT EXISTS idx_item_price_cache_cached_at 
ON item_price_cache(cached_at);

-- Optional: Function to clean up old cache entries (older than 7 days)
CREATE OR REPLACE FUNCTION clean_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM item_price_cache
  WHERE cached_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule automatic cleanup (uncomment if you want auto-cleanup)
-- SELECT cron.schedule('clean-old-cache', '0 0 * * *', 'SELECT clean_old_cache()');
