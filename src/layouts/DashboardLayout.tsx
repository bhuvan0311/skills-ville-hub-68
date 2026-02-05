import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { SidebarNavItem } from '@/components/SidebarNavItem';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { BrandWatermark } from '@/components/BrandWatermark';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  CreditCard,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Bell,
  Megaphone,
  Award,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import skillsVilleLogo from '@/assets/skills-ville-logo.svg';

const adminNavItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/franchises', icon: Users, label: 'Franchises' },
  { to: '/admin/products', icon: Package, label: 'Product Catalog' },
  { to: '/admin/broadcasts', icon: Megaphone, label: 'Broadcasts' },
  { to: '/admin/certificates', icon: Award, label: 'Certificates' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Reports' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function DashboardLayout() {
  const { userRole, userProfile, signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  const franchiseId = userProfile?.franchise_id;

  // Fetch pending payments count for sidebar badge
  useEffect(() => {
    if (!franchiseId || userRole !== 'franchise_owner') return;

    const fetchPendingPayments = async () => {
      const { count } = await supabase
        .from('finance_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('franchise_id', franchiseId)
        .eq('status', 'PENDING');
      
      setPendingPaymentsCount(count || 0);
    };

    fetchPendingPayments();
  }, [franchiseId, userRole]);

  // Dynamic franchise nav items with real badge count
  const franchiseNavItems = [
    { to: '/franchise/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/franchise/students', icon: Users, label: 'Students' },
    { to: '/franchise/inventory', icon: Package, label: 'Inventory' },
    { to: '/franchise/schedule', icon: Calendar, label: 'Schedule' },
    { to: '/franchise/payments', icon: CreditCard, label: 'Payments', badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined },
    { to: '/franchise/teachers', icon: GraduationCap, label: 'Teachers' },
    { to: '/franchise/training', icon: BookOpen, label: 'Training' },
    { to: '/franchise/reports', icon: FileText, label: 'Reports' },
    { to: '/franchise/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = userRole === 'super_admin' ? adminNavItems : franchiseNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* FIXED DESKTOP SIDEBAR 
        - 'hidden': Hides it on mobile (prevents squishing)
        - 'lg:flex': Shows it only on Large screens (PC/Laptop)
      */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border bg-card">
          <div className="flex items-center gap-3">
            <img src={skillsVilleLogo} alt="Skills Ville" className="h-14 w-14 shrink-0" />
            {!sidebarCollapsed && (
              <div className="animate-fade-in">
                <h1 className="text-base font-bold text-foreground">Skills Ville</h1>
                <p className="text-sm text-muted-foreground">Abacus Academy</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              {...item}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full justify-center"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR (OVERLAY) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border animate-slide-in-right">
            <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <img src={skillsVilleLogo} alt="Skills Ville" className="h-14 w-14" />
                <div>
                  <h1 className="text-base font-bold">Skills Ville</h1>
                  <p className="text-sm text-muted-foreground">Abacus Academy</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  {...item}
                  collapsed={false}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 shadow-soft">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <img src={skillsVilleLogo} alt="Skills Ville" className="h-12 w-12" />
                <h2 className="text-lg font-semibold text-foreground">
                  {userRole === 'super_admin' ? 'Skills Ville Admin Portal' : 'Skills Ville Franchise Portal'}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications - Only for Franchise Owners */}
            {userRole === 'franchise_owner' && (
              <NotificationBell />
            )}
            
            {/* Admin Bell - simple version */}
            {userRole === 'super_admin' && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            )}

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(userProfile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">
                    {userProfile?.full_name || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{userProfile?.full_name || 'User'}</span>
                    <span className="text-xs font-normal text-muted-foreground capitalize">
                      {userRole?.replace('_', ' ')}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Brand Watermark */}
        <BrandWatermark />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-background relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
