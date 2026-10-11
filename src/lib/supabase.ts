import { createClient } from "@supabase/supabase-js";
import { studentPhotoPath } from "./studentPhotos";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "not-configured",
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

export type UserRole =
  "super_admin" | "franchise_owner" | "teacher" | "receptionist" | "parent";

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
  type: "FRANCHISE_FEE" | "KIT_PURCHASE";
  description?: string;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  due_date: string;
  paid_at?: string;
  payment_link?: string;
  created_at?: string;
}

export type StudentStatus =
  "ACTIVE" | "INACTIVE" | "PENDING" | "DROPOUT" | "GRADUATED";

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
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(10);

  if (error) {
    // Only log actual errors, not "no rows" which is expected for new users
    if (error.code !== "PGRST116") {
      console.error("Error fetching user role:", error);
    }
    throw error;
  }

  const roles = (data || []).map((row) => row.role);
  if (roles.includes("super_admin")) return "super_admin";

  // New staff and parent roles are managed by Head Office through ERP memberships.
  const { data: memberships, error: membershipError } = await supabase
    .from("erp_memberships")
    .select("role,active")
    .eq("user_id", userId);
  if (membershipError) return null;
  if (roles.includes("franchise_owner") && !memberships?.length)
    return "franchise_owner";
  const membershipRoles = (memberships || [])
    .filter((row) => row.active)
    .map((row) => row.role);
  return (
    (
      ["franchise_owner", "teacher", "receptionist", "parent"] as UserRole[]
    ).find((role) => membershipRoles.includes(role)) ?? null
  );
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Only log actual errors, not "no rows" which is expected for new users
    if (error.code !== "PGRST116") {
      console.error("Error fetching user profile:", error);
    }
    return null;
  }

  if (!data) {
    return null;
  }

  return data as UserProfile;
}

export async function getFinanceLedger(
  franchiseId: string,
): Promise<FinanceLedgerEntry[]> {
  const { data, error } = await supabase
    .from("finance_ledger")
    .select("*")
    .eq("franchise_id", franchiseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching finance ledger:", error);
    throw error;
  }

  return data as FinanceLedgerEntry[];
}

export async function getTotalOutstandingDues(
  franchiseId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("finance_ledger")
    .select("amount")
    .eq("franchise_id", franchiseId)
    .neq("status", "PAID");

  if (error) {
    console.error("Error fetching outstanding dues:", error);
    throw error;
  }

  return data.reduce((sum, entry) => sum + Number(entry.amount), 0);
}

// ============================================
// Batch Functions
// ============================================

export async function getBatches(franchiseId: string): Promise<Batch[]> {
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("franchise_id", franchiseId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching batches:", error);
    throw error;
  }

  return data as Batch[];
}

export async function getBatchesWithStudentCount(
  franchiseId: string,
): Promise<Batch[]> {
  const { data: batches, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("franchise_id", franchiseId)
    .eq("is_active", true)
    .order("name");

  if (batchError) {
    console.error("Error fetching batches:", batchError);
    throw batchError;
  }

  // Get student counts for each batch
  const batchesWithCounts = await Promise.all(
    (batches || []).map(async (batch) => {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("batch_id", batch.id)
        .neq("status", "DROPOUT");

      return {
        ...batch,
        student_count: count || 0,
      };
    }),
  );

  return batchesWithCounts;
}

// ============================================
// Student Functions
// ============================================

export async function getStudents(franchiseId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      batch:batches(id, name, level, schedule)
    `,
    )
    .eq("franchise_id", franchiseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching students:", error);
    throw error;
  }

  const students = data as Student[];
  const paths = [
    ...new Set(
      students
        .map((s) => studentPhotoPath(s.photo_url, supabaseUrl))
        .filter((p): p is string => Boolean(p)),
    ),
  ];
  if (!paths.length)
    return students.map((s) => ({ ...s, photo_url: undefined }));
  const { data: signed, error: photoError } = await supabase.storage
    .from("student-photos")
    .createSignedUrls(paths, 600);
  if (photoError) throw photoError;
  const urls = new Map(
    (signed || []).filter((s) => !s.error).map((s) => [s.path, s.signedUrl]),
  );
  return students.map((s) => ({
    ...s,
    photo_url:
      urls.get(studentPhotoPath(s.photo_url, supabaseUrl) || "") || undefined,
  }));
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
    .from("students")
    .insert({
      ...studentData,
      status: "PENDING",
      level: studentData.level || 1,
      joining_date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating student:", error);
    throw error;
  }

  return data as Student;
}

export async function updateStudentStatus(
  studentId: string,
  status: StudentStatus,
): Promise<boolean> {
  const { error } = await supabase
    .from("students")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) {
    console.error("Error updating student status:", error);
    return false;
  }

  return true;
}

export async function updateStudent(
  studentId: string,
  updates: Partial<Student>,
): Promise<boolean> {
  const { error } = await supabase
    .from("students")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) {
    console.error("Error updating student:", error);
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
  file: File,
): Promise<string | null> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${franchiseId}/${studentId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("student-photos")
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Error uploading photo:", uploadError);
    throw uploadError;
  }

  return fileName;
}

export async function deleteStudentPhoto(
  franchiseId: string,
  studentId: string,
): Promise<boolean> {
  // Try common extensions
  const extensions = ["jpg", "jpeg", "png", "webp"];

  for (const ext of extensions) {
    const fileName = `${franchiseId}/${studentId}.${ext}`;
    const { error } = await supabase.storage
      .from("student-photos")
      .remove([fileName]);
    if (error) throw error;
  }

  return true;
}

// ============================================
// Inventory & Products Functions
// ============================================

export type OrderStatus = "PLACED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

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
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  return data as Product[];
}

export async function getFranchiseInventory(
  franchiseId: string,
): Promise<FranchiseInventory[]> {
  const { data, error } = await supabase
    .from("franchise_inventory")
    .select(
      `
      *,
      product:products(*)
    `,
    )
    .eq("franchise_id", franchiseId);

  if (error) {
    console.error("Error fetching franchise inventory:", error);
    throw error;
  }

  return data as FranchiseInventory[];
}

export async function getProductsWithInventory(
  franchiseId: string,
): Promise<(Product & { quantity: number; low_stock_limit: number })[]> {
  // First get all products
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (productError) {
    console.error("Error fetching products:", productError);
    throw productError;
  }

  // Then get inventory for this franchise
  const { data: inventory, error: invError } = await supabase
    .from("franchise_inventory")
    .select("*")
    .eq("franchise_id", franchiseId);

  if (invError) {
    throw invError;
  }

  // Merge products with inventory
  const inventoryMap = new Map(
    (inventory || []).map((inv) => [inv.product_id, inv]),
  );

  return (products || []).map((product) => ({
    ...product,
    quantity: inventoryMap.get(product.id)?.quantity || 0,
    low_stock_limit: inventoryMap.get(product.id)?.low_stock_limit || 5,
  }));
}

export async function getFranchiseOrders(
  franchiseId: string,
): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("franchise_id", franchiseId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }

  return data as Order[];
}

export async function getActiveStudentCount(
  franchiseId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("franchise_id", franchiseId)
    .eq("status", "ACTIVE");

  if (error) {
    console.error("Error counting students:", error);
    throw error;
  }

  return count || 0;
}

export async function getTotalKitStock(franchiseId: string): Promise<number> {
  const { data, error } = await supabase
    .from("franchise_inventory")
    .select(
      `
      quantity,
      product:products!inner(category)
    `,
    )
    .eq("franchise_id", franchiseId)
    .eq("product.category", "kit");

  if (error) {
    console.error("Error getting kit stock:", error);
    throw error;
  }

  return (data || []).reduce((sum, inv) => sum + (inv.quantity || 0), 0);
}

// ============================================
// Batch CRUD Functions
// ============================================

export async function createBatch(batchData: {
  franchise_id: string;
  name: string;
  level: number;
  schedule?: string;
  max_students?: number;
}): Promise<Batch | null> {
  const { data, error } = await supabase
    .from("batches")
    .insert({
      ...batchData,
      max_students: batchData.max_students || 15,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating batch:", error);
    throw error;
  }

  return data as Batch;
}

export async function getStudentsForBatch(
  batchId: string,
): Promise<{ id: string; name: string; parentPhone: string }[]> {
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, parent_phone")
    .eq("batch_id", batchId)
    .neq("status", "DROPOUT");

  if (error) {
    console.error("Error fetching students for batch:", error);
    throw error;
  }

  return (data || []).map((s) => ({
    id: s.id,
    name: s.full_name,
    parentPhone: s.parent_phone || "",
  }));
}
