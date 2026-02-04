import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Package, Truck, MapPin } from 'lucide-react';

export type OrderStatus = 'placed' | 'dispatched' | 'in_transit' | 'delivered';

interface OrderStepperProps {
  currentStatus: OrderStatus;
  orderId: string;
  className?: string;
}

const steps = [
  { id: 'placed', label: 'Placed', icon: Package },
  { id: 'dispatched', label: 'Dispatched', icon: Truck },
  { id: 'in_transit', label: 'In Transit', icon: MapPin },
  { id: 'delivered', label: 'Delivered', icon: Check },
];

const statusOrder = ['placed', 'dispatched', 'in_transit', 'delivered'];

export function OrderStepper({ currentStatus, orderId, className }: OrderStepperProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className={cn("bg-card border rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">Order #{orderId}</span>
        <span className="text-xs text-muted-foreground">Est. 2-3 days</span>
      </div>
      
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    index < currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
