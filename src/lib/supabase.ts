import { createClient } from '@supabase/supabase-js';
import type { ResourceType, Tier, ResourcePrice } from '@/types';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// Re-export types for backward compatibility
export type { ResourceType, Tier, ResourcePrice };

// CRUD functions for resource_prices
export async function getAllResourcePrices(): Promise<ResourcePrice[]> {
  const { data, error } = await supabase
    .from('resource_prices')
    .select('*');
  
  if (error) {
    console.error('Error fetching resource prices:', error);
    return [];
  }
  
  return data || [];
}

export async function upsertResourcePrice(resourceType: ResourceType, tier: Tier, price: number): Promise<boolean> {
  const { error } = await supabase
    .from('resource_prices')
    .upsert(
      { resource_type: resourceType, tier, price },
      { onConflict: 'resource_type,tier' }
    );
  
  if (error) {
    console.error('Error upserting resource price:', error);
    return false;
  }
  
  return true;
}

export async function upsertMultipleResourcePrices(prices: Array<{ resourceType: ResourceType; tier: Tier; price: number }>): Promise<boolean> {
  const records = prices.map(p => ({
    resource_type: p.resourceType,
    tier: p.tier,
    price: p.price
  }));
  
  console.log('Attempting to upsert records:', records);
  
  const { data, error } = await supabase
    .from('resource_prices')
    .upsert(records, { onConflict: 'resource_type,tier' })
    .select();
  
  if (error) {
    console.error('Error upserting multiple resource prices:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
  
  console.log('Upsert successful, affected rows:', data?.length);
  return true;
}
