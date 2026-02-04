import React from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { ActivityFeed, ActivityItem } from '@/components/dashboard/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  IndianRupee,
  MapPin,
  TrendingUp,
  Building2,
  GraduationCap,
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

// Mock data
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
    message: 'New franchise application from Mysore',
    timestamp: '30 minutes ago',
    status: 'info',
  },
  {
    id: '3',
    type: 'payment',
    message: 'Monthly royalty received from Jayanagar Center',
    timestamp: '1 hour ago',
    status: 'success',
  },
  {
    id: '4',
    type: 'alert',
    message: 'Koramangala Center flagged for low enrollment',
    timestamp: '2 hours ago',
    status: 'warning',
  },
  {
    id: '5',
    type: 'promotion',
    message: '25 students promoted to Level 3 across network',
    timestamp: '3 hours ago',
    status: 'success',
  },
];

const topFranchises = [
  { name: 'Jayanagar', revenue: 85000 },
  { name: 'Koramangala', revenue: 72000 },
  { name: 'Indiranagar', revenue: 68000 },
  { name: 'HSR Layout', revenue: 55000 },
  { name: 'Whitefield', revenue: 48000 },
];

const franchiseLocations = [
  { id: 1, name: 'Jayanagar Center', city: 'Bangalore', students: 45, revenue: '₹85,000', status: 'active' },
  { id: 2, name: 'Koramangala Center', city: 'Bangalore', students: 38, revenue: '₹72,000', status: 'active' },
  { id: 3, name: 'Indiranagar Center', city: 'Bangalore', students: 42, revenue: '₹68,000', status: 'active' },
  { id: 4, name: 'Mysore Main', city: 'Mysore', students: 28, revenue: '₹45,000', status: 'active' },
  { id: 5, name: 'Mangalore Hub', city: 'Mangalore', students: 22, revenue: '₹38,000', status: 'pending' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Network-wide performance overview
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Franchises"
          value={24}
          icon={Building2}
          trend={{ value: 8, isPositive: true }}
          subtitle="2 new this month"
        />
        <KPICard
          title="Total Students"
          value="1,856"
          icon={Users}
          trend={{ value: 15, isPositive: true }}
          subtitle="across all centers"
        />
        <KPICard
          title="Monthly Revenue"
          value="₹12.5L"
          icon={IndianRupee}
          trend={{ value: 22, isPositive: true }}
          subtitle="vs last month"
          variant="success"
        />
        <KPICard
          title="Active Teachers"
          value={86}
          icon={GraduationCap}
          trend={{ value: 5, isPositive: true }}
          subtitle="certified trainers"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Franchises Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top 5 Franchises by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFranchises}
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
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <ActivityFeed activities={mockActivities} />
      </div>

      {/* Franchise Locations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Franchise Network
            </CardTitle>
            <Badge variant="secondary">{franchiseLocations.length} locations</Badge>
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
                {franchiseLocations.map((location) => (
                  <tr key={location.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{location.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{location.city}</td>
                    <td className="py-3 px-4 text-sm">{location.students}</td>
                    <td className="py-3 px-4 text-sm font-medium text-success">{location.revenue}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={location.status === 'active' ? 'default' : 'secondary'}
                        className={location.status === 'active' ? 'bg-success/10 text-success border-success/30' : ''}
                      >
                        {location.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
