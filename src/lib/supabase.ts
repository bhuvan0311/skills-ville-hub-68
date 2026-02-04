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

export interface Franchise {
  id: string;
  franchise_code: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export interface FinanceLedgerEntry {
  id: string;
  franchise_id: string;
  invoice_id: string;
  type: 'FRANCHISE_FEE' | 'KIT_PURCHASE';
  description?: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  due_date: string;
  paid_at?: string;
  payment_link?: string;
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
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}

export async function getFinanceLedger(franchiseId: string): Promise<FinanceLedgerEntry[]> {
  const { data, error } = await supabase
    .from('finance_ledger')
    .select('*')
    .eq('franchise_id', franchiseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching finance ledger:', error);
    return [];
  }

  return data as FinanceLedgerEntry[];
}

export async function getTotalOutstandingDues(franchiseId: string): Promise<number> {
  const { data, error } = await supabase
    .from('finance_ledger')
    .select('amount')
    .eq('franchise_id', franchiseId)
    .neq('status', 'PAID');

  if (error) {
    console.error('Error fetching outstanding dues:', error);
    return 0;
  }

  return data.reduce((sum, entry) => sum + Number(entry.amount), 0);
}
