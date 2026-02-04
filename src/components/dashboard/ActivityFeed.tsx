import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Package,
  UserPlus,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'order' | 'student' | 'promotion' | 'alert' | 'payment' | 'general';
  message: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'info';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const iconMap = {
  order: Package,
  student: UserPlus,
  promotion: GraduationCap,
  alert: AlertTriangle,
  payment: CreditCard,
  general: CheckCircle,
};

const statusColors = {
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  info: 'bg-primary/10 text-primary border-primary/30',
};

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {activities.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6 pb-4">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = iconMap[activity.type];
              return (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 animate-fade-in',
                    { 'animation-delay-100': index > 0 }
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border',
                      statusColors[activity.status || 'info']
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">
                      {activity.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
