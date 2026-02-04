import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  ChevronRight,
} from 'lucide-react';
import { getRecentBroadcasts, subscribeToBroadcasts, Broadcast, BroadcastPriority } from '@/lib/broadcastQueries';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

export function HQNewsWidget() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBroadcasts = async () => {
      setLoading(true);
      const data = await getRecentBroadcasts(30);
      setBroadcasts(data.slice(0, 3));
      setLoading(false);
    };

    fetchBroadcasts();

    // Subscribe to real-time broadcasts
    const unsubscribe = subscribeToBroadcasts((newBroadcast) => {
      setBroadcasts(prev => [newBroadcast, ...prev].slice(0, 3));
    });

    return unsubscribe;
  }, []);

  const getPriorityIcon = (priority: BroadcastPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4" />;
      case 'URGENT':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityStyles = (priority: BroadcastPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          container: 'bg-destructive/10 border border-destructive/30',
          icon: 'text-destructive',
          title: 'text-destructive',
          badge: 'bg-destructive text-destructive-foreground',
        };
      case 'URGENT':
        return {
          container: 'bg-warning/10 border border-warning/30',
          icon: 'text-warning',
          title: 'text-warning',
          badge: 'bg-warning text-warning-foreground',
        };
      default:
        return {
          container: 'bg-primary/5 border border-primary/20',
          icon: 'text-primary',
          title: 'text-primary',
          badge: 'bg-primary/10 text-primary',
        };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Head Office News
          </CardTitle>
          {broadcasts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {broadcasts.length} recent
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No announcements</p>
          </div>
        ) : (
          <>
            {broadcasts.map((broadcast) => {
              const styles = getPriorityStyles(broadcast.priority);
              return (
                <div
                  key={broadcast.id}
                  className={`p-3 rounded-lg ${styles.container} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${styles.icon}`}>
                      {getPriorityIcon(broadcast.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold text-sm ${styles.title}`}>
                          {broadcast.title}
                        </p>
                        {broadcast.priority !== 'NORMAL' && (
                          <Badge className={`text-[10px] px-1.5 py-0 ${styles.badge}`}>
                            {broadcast.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {broadcast.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
              View all announcements
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
