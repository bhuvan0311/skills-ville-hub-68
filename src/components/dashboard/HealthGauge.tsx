import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HealthGaugeProps {
  value: number;
  maxValue?: number;
  title?: string;
  className?: string;
}

export function HealthGauge({ value, maxValue = 100, title = 'Health Score', className }: HealthGaugeProps) {
  const percentage = (value / maxValue) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  const getColor = (val: number) => {
    if (val >= 80) return 'text-success';
    if (val >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getGradientId = (val: number) => {
    if (val >= 80) return 'success-gradient';
    if (val >= 60) return 'warning-gradient';
    return 'danger-gradient';
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-[135deg]" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="success-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--success))" />
                <stop offset="100%" stopColor="hsl(142 76% 46%)" />
              </linearGradient>
              <linearGradient id="warning-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--warning))" />
                <stop offset="100%" stopColor="hsl(38 92% 60%)" />
              </linearGradient>
              <linearGradient id="danger-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--destructive))" />
                <stop offset="100%" stopColor="hsl(0 84% 70%)" />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
              className="text-muted/30"
            />
            {/* Progress arc */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={`url(#${getGradientId(value)})`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-3xl font-bold', getColor(value))}>{value}</span>
            <span className="text-xs text-muted-foreground">/ {maxValue}</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <span
            className={cn(
              'text-sm font-medium',
              value >= 80 ? 'text-success' : value >= 60 ? 'text-warning' : 'text-destructive'
            )}
          >
            {value >= 80 ? 'Excellent' : value >= 60 ? 'Good' : 'Needs Attention'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
