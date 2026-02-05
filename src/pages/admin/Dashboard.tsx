import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KPICard } from '@/components/dashboard/KPICard';
import { ActivityFeed, ActivityItem } from '@/components/dashboard/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  IndianRupee,
  TrendingUp,
  Building2,
  GraduationCap,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { IndiaMap } from '@/components/admin/IndiaMap';
import {
  getAdminDashboardStats,
  getFranchisesByCity,
  getTopFranchisesByRevenue,
  getAllFranchisesWithStats,
  AdminDashboardStats,
  FranchiseWithStats,
  CityData,
} from '@/lib/adminQueries';

// Mock activities for now - can be wired to real data later
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'order',
    message: 'Bulk order shipped to 5 franchises',
    timestamp: '10 minutes ago',
    status: 'success',
  },
  {
    id: '2',
    type: 'student',
    message: 'New franchise application received',
    timestamp: '30 minutes ago',
    status: 'info',
  },
  {
    id: '3',
    type: 'payment',
    message: 'Monthly royalty received',
    timestamp: '1 hour ago',
    status: 'success',
  },
  {
    id: '4',
    type: 'alert',
    message: 'Low enrollment alert flagged',
    timestamp: '2 hours ago',
    status: 'warning',
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [franchisesByCity, setFranchisesByCity] = useState<CityData[]>([]);
  const [topFranchises, setTopFranchises] = useState<FranchiseWithStats[]>([]);
  const [allFranchises, setAllFranchises] = useState<FranchiseWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, cityData, topData, allData] = await Promise.all([
          getAdminDashboardStats(),
          getFranchisesByCity(),
          getTopFranchisesByRevenue(5),
          getAllFranchisesWithStats(),
        ]);
        
        setStats(statsData);
        setFranchisesByCity(cityData);
        setTopFranchises(topData);
        setAllFranchises(allData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatRevenue = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  const chartData = topFranchises.map((f) => ({
    name: f.name.replace(' Center', '').replace(' Main', ''),
    revenue: f.total_revenue || 0,
    students: f.student_count || 0,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">HQ Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Network-wide performance overview
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Franchises"
          value={loading ? '...' : stats?.totalFranchises || 0}
          icon={Building2}
          trend={{ value: 8, isPositive: true }}
          subtitle={`${stats?.activeFranchises || 0} active`}
          navigateTo="/admin/franchises"
          className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        />
        <KPICard
          title="Total Students"
          value={loading ? '...' : (stats?.totalStudents || 0).toLocaleString()}
          icon={Users}
          trend={{ value: 15, isPositive: true }}
          subtitle="across all centers"
          navigateTo="/admin/franchises"
          className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        />
        <KPICard
          title="Network Revenue"
          value={loading ? '...' : formatRevenue(stats?.totalRevenue || 0)}
          icon={IndianRupee}
          trend={{ value: 22, isPositive: true }}
          subtitle="total collected"
          variant="success"
          navigateTo="/admin/payments"
          className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        />
        <KPICard
          title="Active Cities"
          value={loading ? '...' : franchisesByCity.length}
          icon={GraduationCap}
          trend={{ value: 5, isPositive: true }}
          subtitle="across India"
        />
      </div>

      {/* Map & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* India Map */}
        <div className="lg:col-span-2">
          <IndiaMap franchisesByCity={franchisesByCity} />
        </div>

        {/* Activity Feed */}
        <ActivityFeed activities={mockActivities} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Franchises Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top 5 Franchises by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : topFranchises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No franchise data available
              </div>
            ) : (
              <div className="space-y-3">
                {topFranchises.map((franchise, index) => (
                  <div 
                    key={franchise.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-600' : ''}
                        ${index === 1 ? 'bg-gray-400/20 text-gray-600' : ''}
                        ${index === 2 ? 'bg-amber-600/20 text-amber-700' : ''}
                        ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                      `}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{franchise.name}</p>
                        <p className="text-xs text-muted-foreground">{franchise.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-success">
                        {formatRevenue(franchise.total_revenue || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {franchise.student_count} students
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Franchise Network Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              All Franchises
            </CardTitle>
            <Badge variant="secondary">{allFranchises.length} locations</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Center</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">City</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Students</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Revenue</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : allFranchises.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No franchises found
                    </td>
                  </tr>
                ) : (
                  allFranchises.map((franchise) => (
                    <tr key={franchise.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{franchise.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{franchise.city}</td>
                      <td className="py-3 px-4 text-sm">{franchise.student_count || 0}</td>
                      <td className="py-3 px-4 text-sm font-medium text-success">
                        {formatRevenue(franchise.total_revenue || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={franchise.is_active ? 'default' : 'secondary'}
                          className={franchise.is_active ? 'bg-success/10 text-success border-success/30' : ''}
                        >
                          {franchise.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
