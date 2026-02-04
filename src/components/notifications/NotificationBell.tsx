import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getRecentBroadcasts, subscribeToBroadcasts, Broadcast, BroadcastPriority } from '@/lib/broadcastQueries';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function NotificationBell() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Fetch initial broadcasts from last 7 days
    const fetchBroadcasts = async () => {
      const data = await getRecentBroadcasts(7);
      setBroadcasts(data);
      setUnreadCount(data.length);
    };

    fetchBroadcasts();

    // Subscribe to real-time broadcasts
    const unsubscribe = subscribeToBroadcasts((newBroadcast) => {
      setBroadcasts(prev => [newBroadcast, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      const icon = newBroadcast.priority === 'CRITICAL' 
        ? '🚨' 
        : newBroadcast.priority === 'URGENT' 
          ? '⚠️' 
          : '📢';
      
      toast.info(`${icon} ${newBroadcast.title}`, {
        description: newBroadcast.message.substring(0, 100),
        duration: 5000,
      });
    });

    return unsubscribe;
  }, []);

  const getPriorityIcon = (priority: BroadcastPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
      case 'URGENT':
        return <AlertCircle className="h-4 w-4 text-warning shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-primary shrink-0" />;
    }
  };

  const getPriorityStyles = (priority: BroadcastPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-destructive/5 border-l-2 border-l-destructive';
      case 'URGENT':
        return 'bg-warning/5 border-l-2 border-l-warning';
      default:
        return 'bg-muted/30 border-l-2 border-l-primary';
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Mark as read when opened
      setUnreadCount(0);
    }
  };

  const displayBroadcasts = broadcasts.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">HQ Announcements</span>
          </div>
          {broadcasts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {broadcasts.length} this week
            </Badge>
          )}
        </div>
        
        {displayBroadcasts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No announcements yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="divide-y">
              {displayBroadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className={`p-3 ${getPriorityStyles(broadcast.priority)} hover:bg-muted/50 transition-colors`}
                >
                  <div className="flex items-start gap-2">
                    {getPriorityIcon(broadcast.priority)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{broadcast.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {broadcast.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {broadcasts.length > 5 && (
          <div className="p-2 border-t text-center">
            <Button variant="ghost" size="sm" className="text-xs w-full">
              View all announcements
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
