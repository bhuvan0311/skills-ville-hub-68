import React from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number | string;
  collapsed?: boolean;
}

export function SidebarNavItem({ to, icon: Icon, label, badge, collapsed }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <RouterNavLink
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        'hover:bg-sidebar-accent group',
        isActive
          ? 'bg-primary text-primary-foreground shadow-glow'
          : 'text-sidebar-foreground'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-colors',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 font-medium text-sm">{label}</span>
          {badge !== undefined && (
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-semibold rounded-full',
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-destructive text-destructive-foreground'
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </RouterNavLink>
  );
}
