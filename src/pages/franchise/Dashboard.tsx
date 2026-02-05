import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { KPICard } from '@/components/dashboard/KPICard';
import { HealthGauge } from '@/components/dashboard/HealthGauge';
import { ActivityFeed, ActivityItem } from '@/components/dashboard/ActivityFeed';
import { RetentionChart } from '@/components/dashboard/RetentionChart';
import { HQNewsWidget } from '@/components/dashboard/HQNewsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  IndianRupee, 
  AlertTriangle, 
  GraduationCap, 
  Package,
  Calendar,
  FileText,
  ChevronRight,
} from 'lucide-react';

const retentionData = [
  { month: 'Jan', attendance: 95, dropouts: 3 },
  { month: 'Feb', attendance: 92, dropouts: 5 },
  { month: 'Mar', attendance: 88, dropouts: 8 },
  { month: 'Apr', attendance: 94, dropouts: 4 },
  { month: 'May', attendance: 96, dropouts: 2 },
  { month: 'Jun', attendance: 90, dropouts: 6 },
];

interface DashboardStats {
  activeStudents: number;
  totalDues: number;
  pendingAlerts: number;
  healthScore: number;
}

export default function FranchiseDashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [needsAttention, setNeedsAttention] = useState<{ id: string; title: string; description: string; actions: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  const franchiseId = userProfile?.franchise_id;

  useEffect(() => {
    if (!franchiseId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch active students count
        const { count: activeStudentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('franchise_id', franchiseId)
          .eq('status', 'ACTIVE');

        // Fetch pending dues
        const { data: pendingDues } = await supabase
          .from('finance_ledger')
          .select('amount')
          .eq('franchise_id', franchiseId)
          .eq('status', 'PENDING');

        const totalDues = (pendingDues || []).reduce((sum, entry) => sum + Number(entry.amount), 0);

        // Fetch unread notifications count (handle if table doesn't exist)
        let pendingAlertsCount = 0;
        try {
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('franchise_id', franchiseId)
            .eq('read', false);
          pendingAlertsCount = count || 0;
        } catch {
          // Table doesn't exist yet, default to 0
          pendingAlertsCount = 0;
        }

        // Fetch dropout count for health score calculation
        const { count: dropoutCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('franchise_id', franchiseId)
          .eq('status', 'DROPOUT');

        // Calculate health score: 100 - (dropouts * 5), capped at 0-100
        const calculatedHealthScore = Math.max(0, Math.min(100, 100 - ((dropoutCount || 0) * 5)));

        setStats({
          activeStudents: activeStudentsCount || 0,
          totalDues,
          pendingAlerts: pendingAlertsCount,
          healthScore: calculatedHealthScore,
        });

        // Generate dynamic "Needs Attention" items
        const attentionItems: { id: string; title: string; description: string; actions: string[] }[] = [];
        
        // Check for low stock
        const { data: lowStockItems } = await supabase
          .from('franchise_inventory')
          .select('quantity, low_stock_limit, product:products(name)')
          .eq('franchise_id', franchiseId);

        const lowStock = (lowStockItems || []).filter(
          (item) => item.quantity <= item.low_stock_limit
        );

        if (lowStock.length > 0) {
          attentionItems.push({
            id: 'low-stock',
            title: 'Low Inventory Alert',
            description: `${lowStock.length} product(s) running low on stock`,
            actions: ['Order Now', 'Dismiss'],
          });
        }

        // Check for overdue payments
        const { count: overdueCount } = await supabase
          .from('finance_ledger')
          .select('*', { count: 'exact', head: true })
          .eq('franchise_id', franchiseId)
          .eq('status', 'OVERDUE');

        if ((overdueCount || 0) > 0) {
          attentionItems.push({
            id: 'overdue-payments',
            title: 'Overdue Payments',
            description: `${overdueCount} payment(s) are overdue`,
            actions: ['View Payments', 'Dismiss'],
          });
        }

        setNeedsAttention(attentionItems);

        // Set placeholder activities (can be wired to real activity log later)
        setActivities([
          {
            id: '1',
            type: 'general',
            message: 'Dashboard connected to live data',
            timestamp: 'Just now',
            status: 'success',
          },
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set defaults on error
        setStats({
          activeStudents: 0,
          totalDues: 0,
          pendingAlerts: 0,
          healthScore: 100,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [franchiseId]);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Add Student':
        navigate('/franchise/students');
        break;
      case 'Schedule Class':
        navigate('/franchise/schedule');
        break;
      case 'Order Inventory':
        navigate('/franchise/inventory');
        break;
      case 'View Reports':
        navigate('/franchise/reports');
        break;
      case 'Order Now':
        navigate('/franchise/inventory');
        break;
      case 'View Payments':
        navigate('/franchise/payments');
        break;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here's an overview of your franchise.
        </p>
      </div>

      {/* KPI Cards Grid - The Command Center */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : (
          <>
            <KPICard
              title="Total Active Students"
              value={stats?.activeStudents || 0}
              icon={Users}
              subtitle="enrolled students"
              navigateTo="/franchise/students"
            />
            <KPICard
              title="Dues Pending"
              value={formatCurrency(stats?.totalDues || 0)}
              icon={IndianRupee}
              variant={stats?.totalDues && stats.totalDues > 0 ? 'danger' : 'default'}
              subtitle="outstanding amount"
              navigateTo="/franchise/payments"
            />
            <HealthGauge value={stats?.healthScore || 100} title="Franchise Health Score" />
            <KPICard
              title="Pending Alerts"
              value={stats?.pendingAlerts || 0}
              icon={AlertTriangle}
              variant={stats?.pendingAlerts && stats.pendingAlerts > 0 ? 'warning' : 'default'}
              subtitle="unread notifications"
            />
          </>
        )}
      </div>

      {/* Charts, Activity, and HQ News - Main Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <RetentionChart data={retentionData} className="lg:col-span-2" />
        <ActivityFeed activities={activities} />
        <HQNewsWidget />
      </div>

      {/* Needs Attention Section - Auto-Progression UI */}
      {needsAttention.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Needs Attention
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {needsAttention.map((item) => (
              <Card key={item.id} className="border-warning/30 bg-warning/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-warning" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description}
                  </p>
                  <div className="flex gap-2">
                    {item.actions.map((action, index) => (
                      <Button
                        key={action}
                        variant={index === 0 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleQuickAction(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions - Clean Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Add Student', icon: Users, color: 'text-primary' },
            { label: 'Schedule Class', icon: Calendar, color: 'text-success' },
            { label: 'Order Inventory', icon: Package, color: 'text-warning' },
            { label: 'View Reports', icon: FileText, color: 'text-accent' },
          ].map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 bg-card hover:bg-primary hover:text-primary-foreground transition-all group"
              onClick={() => handleQuickAction(action.label)}
            >
              <action.icon className={`h-5 w-5 ${action.color} group-hover:text-primary-foreground transition-colors`} />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
