import { supabase, Franchise } from './supabase';

// ============================================
// Admin Dashboard Aggregated Queries
// ============================================

export interface AdminDashboardStats {
  totalFranchises: number;
  totalStudents: number;
  totalRevenue: number;
  activeFranchises: number;
}

export interface FranchiseWithStats extends Franchise {
  student_count?: number;
  total_revenue?: number;
}

export interface CityData {
  city: string;
  count: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  // Get total franchises
  const { count: totalFranchises } = await supabase
    .from('franchises')
    .select('*', { count: 'exact', head: true });

  // Get active franchises
  const { count: activeFranchises } = await supabase
    .from('franchises')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Get total students across all franchises
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'DROPOUT');

  // Get total paid revenue from finance_ledger
  const { data: revenueData } = await supabase
    .from('finance_ledger')
    .select('amount')
    .eq('status', 'PAID');

  const totalRevenue = (revenueData || []).reduce((sum, entry) => sum + Number(entry.amount), 0);

  return {
    totalFranchises: totalFranchises || 0,
    totalStudents: totalStudents || 0,
    totalRevenue,
    activeFranchises: activeFranchises || 0,
  };
}

export async function getFranchisesByCity(): Promise<CityData[]> {
  const { data, error } = await supabase
    .from('franchises')
    .select('city')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching franchises by city:', error);
    return [];
  }

  // Aggregate by city
  const cityMap = new Map<string, number>();
  (data || []).forEach((f) => {
    const city = f.city || 'Unknown';
    cityMap.set(city, (cityMap.get(city) || 0) + 1);
  });

  return Array.from(cityMap.entries()).map(([city, count]) => ({ city, count }));
}

export async function getTopFranchisesByRevenue(limit = 5): Promise<FranchiseWithStats[]> {
  // Get all franchises
  const { data: franchises, error } = await supabase
    .from('franchises')
    .select('*')
    .eq('is_active', true);

  if (error || !franchises) {
    console.error('Error fetching franchises:', error);
    return [];
  }

  // Get revenue for each franchise
  const franchisesWithRevenue = await Promise.all(
    franchises.map(async (franchise) => {
      const { data: ledger } = await supabase
        .from('finance_ledger')
        .select('amount')
        .eq('franchise_id', franchise.id)
        .eq('status', 'PAID');

      const totalRevenue = (ledger || []).reduce((sum, entry) => sum + Number(entry.amount), 0);

      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('franchise_id', franchise.id)
        .neq('status', 'DROPOUT');

      return {
        ...franchise,
        total_revenue: totalRevenue,
        student_count: studentCount || 0,
      };
    })
  );

  // Sort by revenue and return top N
  return franchisesWithRevenue
    .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
    .slice(0, limit);
}

export async function getAllFranchisesWithStats(): Promise<FranchiseWithStats[]> {
  const { data: franchises, error } = await supabase
    .from('franchises')
    .select('*')
    .order('name');

  if (error || !franchises) {
    console.error('Error fetching franchises:', error);
    return [];
  }

  // Get stats for each franchise
  const franchisesWithStats = await Promise.all(
    franchises.map(async (franchise) => {
      const { data: ledger } = await supabase
        .from('finance_ledger')
        .select('amount')
        .eq('franchise_id', franchise.id)
        .eq('status', 'PAID');

      const totalRevenue = (ledger || []).reduce((sum, entry) => sum + Number(entry.amount), 0);

      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('franchise_id', franchise.id)
        .neq('status', 'DROPOUT');

      return {
        ...franchise,
        total_revenue: totalRevenue,
        student_count: studentCount || 0,
      };
    })
  );

  return franchisesWithStats;
}

// ============================================
// Product Management (Admin Only)
// ============================================

export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching all products:', error);
    return [];
  }

  return data || [];
}

export async function createProduct(productData: {
  name: string;
  category: string;
  price: number;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...productData,
      is_active: productData.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProduct(
  productId: string,
  updates: {
    name?: string;
    category?: string;
    price?: number;
    description?: string;
    image_url?: string;
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
