# Supabase Cache Setup

## ⚠️ WICHTIG: Zuerst die Tabelle erstellen!

Wenn du **409 Errors** siehst, existiert die Tabelle noch nicht oder hat das falsche Schema.

## Quick Setup (3 Schritte)

### 1. Öffne Supabase SQL Editor

- Gehe zu: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
- Klicke auf "New query"

### 2. Führe das SQL aus

Kopiere den **kompletten Inhalt** von `SUPABASE_SCHEMA.sql` und führe ihn aus.

Oder kopiere direkt:

```sql
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

-- Disable RLS
ALTER TABLE item_price_cache DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_item_price_cache_lookup
ON item_price_cache(item_id, location);

CREATE INDEX idx_item_price_cache_cached_at
ON item_price_cache(cached_at);
```

### 3. Verifiziere die Tabelle

Führe das aus um zu prüfen ob die Tabelle existiert:

```sql
SELECT * FROM item_price_cache LIMIT 1;
```

✅ Wenn das funktioniert → Fertig! Reload deine App.

## Troubleshooting

### 409 Conflict Errors

**Problem:** Tabelle existiert nicht oder hat falsches Schema  
**Lösung:** SQL oben ausführen (DROP TABLE löscht alte Version)

### 400 Bad Request

**Problem:** Supabase URL/Key falsch oder Tabelle nicht zugänglich  
**Lösung:** Prüfe `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=YOUR_ANON_KEY
```

### Cache funktioniert nicht

**Problem:** RLS (Row Level Security) blockiert Zugriff  
**Lösung:** `ALTER TABLE item_price_cache DISABLE ROW LEVEL SECURITY;`

## Wie der Cache funktioniert

1. **Cache Check**: Bei jedem Preis-Request prüft die App zuerst die Datenbank
2. **Cache Hit**: Wenn Daten < 72h alt sind → direkt aus DB laden (schnell!)
3. **Cache Miss**: Wenn keine Daten oder zu alt → Albion API aufrufen → In DB speichern
4. **Batch Processing**: Alle Requests werden in 10-Item Batches verarbeitet

## Cache-Dauer

- **72 Stunden**: Preise werden für 72 Stunden gecacht, danach werden sie neu von der Albion API geladen

## Cache leeren (Optional)

Falls du den Cache komplett leeren möchtest:

```sql
TRUNCATE TABLE item_price_cache;
```

## Alte Einträge löschen (Optional)

Um Speicherplatz zu sparen:

```sql
-- Löscht alle Einträge älter als 7 Tage
DELETE FROM item_price_cache
WHERE cached_at < NOW() - INTERVAL '7 days';
```
