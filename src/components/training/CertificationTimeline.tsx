import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Lock, ExternalLink, Award } from 'lucide-react';

type TrainingStatus = 'completed' | 'scheduled' | 'locked';

interface TrainingStep {
  id: string;
  title: string;
  status: TrainingStatus;
  completedDate?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  zoomLink?: string;
}

interface CertificationTimelineProps {
  steps: TrainingStep[];
  teacherName: string;
}

const statusConfig = {
  completed: {
    badge: 'COMPLETED',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200',
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    bgClass: 'bg-green-50 dark:bg-green-950/20',
    lineClass: 'bg-green-500',
  },
  scheduled: {
    badge: 'SCHEDULED',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
    icon: Clock,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-950/20',
    lineClass: 'bg-blue-500',
  },
  locked: {
    badge: 'LOCKED',
    badgeClass: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200',
    icon: Lock,
    iconClass: 'text-gray-400',
    bgClass: 'bg-gray-50 dark:bg-gray-900/20',
    lineClass: 'bg-gray-300 dark:bg-gray-700',
  },
};

export function CertificationTimeline({ steps, teacherName }: CertificationTimelineProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Certification Progress</h3>
      </div>
      
      <div className="relative">
        {steps.map((step, index) => {
          const config = statusConfig[step.status];
          const Icon = config.icon;
          const isLast = index === steps.length - 1;
          const isLocked = step.status === 'locked';

          return (
            <div
              key={step.id}
              className={`relative flex gap-4 pb-8 ${isLocked ? 'opacity-50' : ''}`}
            >
              {/* Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-[calc(100%-40px)] ${config.lineClass}`}
                />
              )}

              {/* Icon Circle */}
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.status === 'completed'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : step.status === 'scheduled'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-600'
                }`}
              >
                <Icon className={`h-5 w-5 ${config.iconClass}`} />
              </div>

              {/* Content Card */}
              <div
                className={`flex-1 p-4 rounded-lg border ${config.bgClass} ${
                  isLocked ? 'border-dashed' : 'border-solid'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{step.title}</h4>
                      <Badge variant="outline" className={config.badgeClass}>
                        {config.badge}
                      </Badge>
                    </div>

                    {step.status === 'completed' && step.completedDate && (
                      <p className="text-sm text-muted-foreground">
                        Certified on {step.completedDate}
                      </p>
                    )}

                    {step.status === 'scheduled' && (
                      <p className="text-sm text-muted-foreground">
                        {step.scheduledDate} @ {step.scheduledTime}
                      </p>
                    )}

                    {step.status === 'locked' && (
                      <p className="text-sm text-muted-foreground">
                        Complete {steps[index - 1]?.title} to unlock
                      </p>
                    )}
                  </div>

                  {step.status === 'scheduled' && step.zoomLink && (
                    <Button size="sm" className="gap-2 shrink-0">
                      <ExternalLink className="h-3 w-3" />
                      Join Zoom Link
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
