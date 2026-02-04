import React from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { HealthGauge } from '@/components/dashboard/HealthGauge';
import { ActivityFeed, ActivityItem } from '@/components/dashboard/ActivityFeed';
import { RetentionChart } from '@/components/dashboard/RetentionChart';
import { HQNewsWidget } from '@/components/dashboard/HQNewsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, IndianRupee, AlertTriangle, GraduationCap, ArrowRight } from 'lucide-react';

// Mock data
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'order',
    message: 'Order #404 dispatched to Jayanagar Center',
    timestamp: '2 minutes ago',
    status: 'success',
  },
  {
    id: '2',
    type: 'promotion',
    message: 'Student Arjun promoted to Level 2',
    timestamp: '15 minutes ago',
    status: 'success',
  },
  {
    id: '3',
    type: 'student',
    message: 'New student Priya enrolled in Batch A',
    timestamp: '1 hour ago',
    status: 'info',
  },
  {
    id: '4',
    type: 'alert',
    message: 'Low stock alert: Abacus Kits (5 remaining)',
    timestamp: '2 hours ago',
    status: 'warning',
  },
  {
    id: '5',
    type: 'payment',
    message: 'Payment of ₹5,000 received from Koramangala Center',
    timestamp: '3 hours ago',
    status: 'success',
  },
  {
    id: '6',
    type: 'student',
    message: 'Student Aarav marked absent - Parent notified',
    timestamp: '4 hours ago',
    status: 'info',
  },
];

const retentionData = [
  { month: 'Jan', attendance: 95, dropouts: 3 },
  { month: 'Feb', attendance: 92, dropouts: 5 },
  { month: 'Mar', attendance: 88, dropouts: 8 },
  { month: 'Apr', attendance: 94, dropouts: 4 },
  { month: 'May', attendance: 96, dropouts: 2 },
  { month: 'Jun', attendance: 90, dropouts: 6 },
];

const needsAttention = [
  {
    id: '1',
    title: 'Batch A completed 12 weeks',
    description: 'Schedule level assessment exam',
    actions: ['Schedule Exam', 'Remedial Class'],
  },
  {
    id: '2',
    title: 'Kit stock running low',
    description: '5 units remaining, 8 new enrollments pending',
    actions: ['Order Now', 'Dismiss'],
  },
];

export default function FranchiseDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here's an overview of your franchise.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Active Students"
          value={156}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          subtitle="vs last month"
        />
        <KPICard
          title="Dues Pending"
          value="₹45,000"
          icon={IndianRupee}
          variant="danger"
          subtitle="3 invoices overdue"
        />
        <HealthGauge value={78} title="Franchise Health Score" />
        <KPICard
          title="Pending Alerts"
          value={4}
          icon={AlertTriangle}
          variant="warning"
          subtitle="Requires action"
        />
      </div>

      {/* Charts, Activity, and HQ News */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <RetentionChart data={retentionData} className="lg:col-span-2" />
        <ActivityFeed activities={mockActivities} />
        <HQNewsWidget />
      </div>

      {/* Needs Attention Section */}
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
                  <GraduationCap className="h-4 w-4" />
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Add New Student', icon: Users },
          { label: 'Schedule Class', icon: GraduationCap },
          { label: 'Order Inventory', icon: AlertTriangle },
          { label: 'View Reports', icon: ArrowRight },
        ].map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <action.icon className="h-5 w-5" />
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
