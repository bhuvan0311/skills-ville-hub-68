-- Fresh Supabase projects only. Never apply this baseline to an existing Skills Ville database.
-- Contains table definitions only: no sample franchises, students, fees or payments.
begin;
do $$ begin
  if exists(select 1 from pg_tables where schemaname='public' and tablename in ('franchises','profiles','user_roles','students','batches','finance_ledger')) then
    raise exception 'Core tables already exist. Review the existing schema and apply only incremental ERP migrations.';
  end if;
end $$;
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

-- 8. Create batches table
CREATE TABLE public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    schedule TEXT,
    max_students INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create student_status enum
CREATE TYPE public.student_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'DROPOUT', 'GRADUATED');

-- 10. Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    dob DATE,
    level INTEGER DEFAULT 1,
    status student_status DEFAULT 'PENDING',
    photo_url TEXT,
    parent_name TEXT,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    address TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Enable Row Level Security on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 12. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 13. Create function to get user's franchise_id
CREATE OR REPLACE FUNCTION public.get_user_franchise_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT franchise_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- 14. RLS Policies for user_roles
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- 15. RLS Policies for franchises
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

-- 16. RLS Policies for profiles
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

-- 17. RLS Policies for finance_ledger
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

-- 18. RLS Policies for batches
CREATE POLICY "Franchise owners can view their own batches"
ON public.batches FOR SELECT
TO authenticated
USING (
  franchise_id = public.get_user_franchise_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Franchise owners can manage their own batches"
ON public.batches FOR ALL
TO authenticated
USING (
  franchise_id = public.get_user_franchise_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 19. RLS Policies for students
CREATE POLICY "Franchise owners can view their own students"
ON public.students FOR SELECT
TO authenticated
USING (
  franchise_id = public.get_user_franchise_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Franchise owners can insert students in their franchise"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (
  franchise_id = public.get_user_franchise_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Franchise owners can update their own students"
ON public.students FOR UPDATE
TO authenticated
USING (
  franchise_id = public.get_user_franchise_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Franchise owners can delete their own students"
ON public.students FOR DELETE
TO authenticated
USING (
  franchise_id = public.get_user_franchise_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 20. Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 21. Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_franchise_id ON public.profiles(franchise_id);
CREATE INDEX idx_finance_ledger_franchise_id ON public.finance_ledger(franchise_id);
CREATE INDEX idx_finance_ledger_status ON public.finance_ledger(status);
CREATE INDEX idx_batches_franchise_id ON public.batches(franchise_id);
CREATE INDEX idx_students_franchise_id ON public.students(franchise_id);
CREATE INDEX idx_students_batch_id ON public.students(batch_id);
CREATE INDEX idx_students_status ON public.students(status);
-- Supabase API grants are explicit; RLS still controls all authenticated access.
revoke all on public.user_roles,public.franchises,public.profiles,public.finance_ledger,public.batches,public.students from anon;
grant select,insert,update,delete on public.user_roles,public.franchises,public.profiles,public.finance_ledger,public.batches,public.students to authenticated;
revoke all on function public.has_role(uuid,public.app_role),public.get_user_franchise_id(uuid),public.handle_new_user() from public,anon;
grant execute on function public.has_role(uuid,public.app_role),public.get_user_franchise_id(uuid) to authenticated;
commit;
