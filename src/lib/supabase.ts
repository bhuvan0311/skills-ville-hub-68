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
    .maybeSingle();

  if (error) {
    // Only log actual errors, not "no rows" which is expected for new users
    if (error.code !== 'PGRST116') {
      console.error('Error fetching user role:', error);
    }
    return null;
  }

  if (!data) {
    return null;
  }

  return data.role as UserRole;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // Only log actual errors, not "no rows" which is expected for new users
    if (error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
    }
    return null;
  }

  if (!data) {
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

// ============================================
// Inventory & Products Functions
// ============================================

export type OrderStatus = 'PLACED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface FranchiseInventory {
  id: string;
  franchise_id: string;
  product_id: string;
  quantity: number;
  low_stock_limit: number;
  product?: Product;
}

export interface Order {
  id: string;
  franchise_id: string;
  total_amount: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data as Product[];
}

export async function getFranchiseInventory(franchiseId: string): Promise<FranchiseInventory[]> {
  const { data, error } = await supabase
    .from('franchise_inventory')
    .select(`
      *,
      product:products(*)
    `)
    .eq('franchise_id', franchiseId);

  if (error) {
    console.error('Error fetching franchise inventory:', error);
    return [];
  }

  return data as FranchiseInventory[];
}

export async function getProductsWithInventory(franchiseId: string): Promise<(Product & { quantity: number; low_stock_limit: number })[]> {
  // First get all products
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (productError) {
    console.error('Error fetching products:', productError);
    return [];
  }

  // Then get inventory for this franchise
  const { data: inventory, error: invError } = await supabase
    .from('franchise_inventory')
    .select('*')
    .eq('franchise_id', franchiseId);

  if (invError) {
    console.error('Error fetching inventory:', invError);
  }

  // Merge products with inventory
  const inventoryMap = new Map((inventory || []).map(inv => [inv.product_id, inv]));
  
  return (products || []).map(product => ({
    ...product,
    quantity: inventoryMap.get(product.id)?.quantity || 0,
    low_stock_limit: inventoryMap.get(product.id)?.low_stock_limit || 5,
  }));
}

export async function getFranchiseOrders(franchiseId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('franchise_id', franchiseId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data as Order[];
}

export async function createOrder(
  franchiseId: string,
  items: { productId: string; quantity: number; unitPrice: number }[],
  totalAmount: number
): Promise<Order | null> {
  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      franchise_id: franchiseId,
      total_amount: totalAmount,
      status: 'PLACED',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw orderError;
  }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
  }

  // Create a finance ledger entry for this order
  const invoiceId = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  
  const { error: ledgerError } = await supabase
    .from('finance_ledger')
    .insert({
      franchise_id: franchiseId,
      invoice_id: invoiceId,
      type: 'KIT_PURCHASE',
      description: `Order #${order.id.substring(0, 8)}`,
      amount: totalAmount,
      status: 'PENDING',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

  if (ledgerError) {
    console.error('Error creating ledger entry:', ledgerError);
  }

  return order as Order;
}

export async function getActiveStudentCount(franchiseId: string): Promise<number> {
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('franchise_id', franchiseId)
    .eq('status', 'ACTIVE');

  if (error) {
    console.error('Error counting students:', error);
    return 0;
  }

  return count || 0;
}

export async function getTotalKitStock(franchiseId: string): Promise<number> {
  const { data, error } = await supabase
    .from('franchise_inventory')
    .select(`
      quantity,
      product:products!inner(category)
    `)
    .eq('franchise_id', franchiseId)
    .eq('product.category', 'kit');

  if (error) {
    console.error('Error getting kit stock:', error);
    return 0;
  }

  return (data || []).reduce((sum, inv) => sum + (inv.quantity || 0), 0);
}
