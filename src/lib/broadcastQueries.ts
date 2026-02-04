import { supabase } from './supabase';

// ============================================
// Broadcasts System
// ============================================

export type BroadcastPriority = 'NORMAL' | 'URGENT' | 'CRITICAL';

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  priority: BroadcastPriority;
  created_at: string;
  created_by: string;
  target_audience: string;
  // Joined data
  creator?: {
    full_name: string;
  };
}

export async function getBroadcasts(limit = 10): Promise<Broadcast[]> {
  const { data, error } = await supabase
    .from('broadcasts')
    .select(`
      *,
      creator:profiles!created_by(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching broadcasts:', error);
    return [];
  }

  return data as Broadcast[];
}

export async function getRecentBroadcasts(days = 7): Promise<Broadcast[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recent broadcasts:', error);
    return [];
  }

  return data as Broadcast[];
}

export async function createBroadcast(broadcastData: {
  title: string;
  message: string;
  priority: BroadcastPriority;
  created_by: string;
}): Promise<Broadcast | null> {
  const { data, error } = await supabase
    .from('broadcasts')
    .insert({
      ...broadcastData,
      target_audience: 'ALL_FRANCHISES',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating broadcast:', error);
    throw error;
  }

  return data as Broadcast;
}

// Real-time subscription helper
export function subscribeToBroadcasts(callback: (broadcast: Broadcast) => void) {
  const channel = supabase
    .channel('broadcasts-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'broadcasts',
      },
      (payload) => {
        callback(payload.new as Broadcast);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
