-- ============================================
-- Skills Ville Abacus - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create app_role enum for roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'franchise_owner');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- 3. Create franchises table
CREATE TABLE public.franchises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    franchise_id UUID REFERENCES public.franchises(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create invoice_type enum
CREATE TYPE public.invoice_type AS ENUM ('FRANCHISE_FEE', 'KIT_PURCHASE');

-- 6. Create invoice_status enum
CREATE TYPE public.invoice_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- 7. Create finance_ledger table (the credit/ledger system)
CREATE TABLE public.finance_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
    invoice_id TEXT UNIQUE NOT NULL,
    type invoice_type NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    status invoice_status DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    payment_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row Level Security on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_ledger ENABLE ROW LEVEL SECURITY;

-- 9. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 10. Create function to get user's franchise_id
CREATE OR REPLACE FUNCTION public.get_user_franchise_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT franchise_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- 11. RLS Policies for user_roles
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- 12. RLS Policies for franchises
CREATE POLICY "Users can view their own franchise"
ON public.franchises FOR SELECT
TO authenticated
USING (
  id = public.get_user_franchise_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Super admins can manage all franchises"
ON public.franchises FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- 13. RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- 14. RLS Policies for finance_ledger
CREATE POLICY "Franchise owners can view their own ledger"
ON public.finance_ledger FOR SELECT
TO authenticated
USING (
  franchise_id = public.get_user_franchise_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Super admins can manage all ledger entries"
ON public.finance_ledger FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- 15. Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 16. Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_franchise_id ON public.profiles(franchise_id);
CREATE INDEX idx_finance_ledger_franchise_id ON public.finance_ledger(franchise_id);
CREATE INDEX idx_finance_ledger_status ON public.finance_ledger(status);

-- ============================================
-- Sample Data (Run after schema is created)
-- ============================================

-- Insert a sample franchise
INSERT INTO public.franchises (id, franchise_code, name, city, address, phone, email)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'BLR-01',
  'Jayanagar Center',
  'Bangalore',
  '123 Jayanagar, 4th Block',
  '+91 98765 43210',
  'jayanagar@skillsville.com'
);

-- Insert sample ledger entries
INSERT INTO public.finance_ledger (franchise_id, invoice_id, type, description, amount, status, due_date)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'INV-2024-001', 'FRANCHISE_FEE', 'January Franchise Fee', 10000.00, 'OVERDUE', '2024-01-31'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'INV-2024-002', 'KIT_PURCHASE', 'Kit Order #405', 5000.00, 'PENDING', '2024-02-10'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'INV-2023-045', 'FRANCHISE_FEE', 'December Franchise Fee', 10000.00, 'PAID', '2023-12-31'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'INV-2023-042', 'KIT_PURCHASE', 'Kit Order #398', 3500.00, 'PAID', '2023-12-25');
