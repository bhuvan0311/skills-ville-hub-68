import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ogblnmyxdizmlfxvporo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nYmxubXl4ZGl6bWxmeHZwb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDM5NzksImV4cCI6MjA4NTc3OTk3OX0.vpGAbuELXyd3zRVzSh3IWGJJ_KjivcSTsvmj53l9OjQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type UserRole = 'super_admin' | 'franchise_owner';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  franchise_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data.role as UserRole;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}
