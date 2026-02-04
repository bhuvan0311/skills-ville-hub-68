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

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DROPOUT' | 'GRADUATED';

export interface Student {
  id: string;
  franchise_id: string;
  batch_id?: string;
  full_name: string;
  dob?: string;
  level: number;
  status: StudentStatus;
  photo_url?: string;
  parent_name?: string;
  parent_phone: string;
  parent_email?: string;
  address?: string;
  joining_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  batch?: Batch;
}

export interface Batch {
  id: string;
  franchise_id: string;
  name: string;
  level: number;
  schedule?: string;
  max_students: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  student_count?: number;
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

// ============================================
// Batch Functions
// ============================================

export async function getBatches(franchiseId: string): Promise<Batch[]> {
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('franchise_id', franchiseId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching batches:', error);
    return [];
  }

  return data as Batch[];
}

export async function getBatchesWithStudentCount(franchiseId: string): Promise<Batch[]> {
  const { data: batches, error: batchError } = await supabase
    .from('batches')
    .select('*')
    .eq('franchise_id', franchiseId)
    .eq('is_active', true)
    .order('name');

  if (batchError) {
    console.error('Error fetching batches:', batchError);
    return [];
  }

  // Get student counts for each batch
  const batchesWithCounts = await Promise.all(
    (batches || []).map(async (batch) => {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batch.id)
        .neq('status', 'DROPOUT');

      return {
        ...batch,
        student_count: count || 0,
      };
    })
  );

  return batchesWithCounts;
}

// ============================================
// Student Functions
// ============================================

export async function getStudents(franchiseId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      batch:batches(id, name, level, schedule)
    `)
    .eq('franchise_id', franchiseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data as Student[];
}

export async function createStudent(studentData: {
  franchise_id: string;
  full_name: string;
  dob?: string;
  level?: number;
  batch_id?: string;
  parent_name?: string;
  parent_phone: string;
  parent_email?: string;
  address?: string;
  photo_url?: string;
}): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .insert({
      ...studentData,
      status: 'PENDING',
      level: studentData.level || 1,
      joining_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating student:', error);
    throw error;
  }

  return data as Student;
}

export async function updateStudentStatus(
  studentId: string,
  status: StudentStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('students')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', studentId);

  if (error) {
    console.error('Error updating student status:', error);
    return false;
  }

  return true;
}

export async function updateStudent(
  studentId: string,
  updates: Partial<Student>
): Promise<boolean> {
  const { error } = await supabase
    .from('students')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', studentId);

  if (error) {
    console.error('Error updating student:', error);
    return false;
  }

  return true;
}

// ============================================
// Storage Functions
// ============================================

export async function uploadStudentPhoto(
  franchiseId: string,
  studentId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${franchiseId}/${studentId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('student-photos')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from('student-photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function deleteStudentPhoto(
  franchiseId: string,
  studentId: string
): Promise<boolean> {
  // Try common extensions
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  
  for (const ext of extensions) {
    const fileName = `${franchiseId}/${studentId}.${ext}`;
    await supabase.storage.from('student-photos').remove([fileName]);
  }

  return true;
}
