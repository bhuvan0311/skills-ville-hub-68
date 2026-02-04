import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Megaphone, 
  Plus, 
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { getBroadcasts, Broadcast, BroadcastPriority } from '@/lib/broadcastQueries';
import { CreateBroadcastModal } from '@/components/admin/CreateBroadcastModal';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const data = await getBroadcasts(50);
      setBroadcasts(data);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      toast.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleBroadcastCreated = () => {
    fetchBroadcasts();
    setModalOpen(false);
  };

  const getPriorityIcon = (priority: BroadcastPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'URGENT':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getPriorityBadge = (priority: BroadcastPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Critical
          </Badge>
        );
      case 'URGENT':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30 gap-1">
            <AlertCircle className="h-3 w-3" />
            Urgent
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" />
            Normal
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broadcasts</h1>
          <p className="text-sm text-muted-foreground">
            Send announcements to all franchise owners
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {/* Broadcasts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Announcement History
            <Badge variant="secondary" className="ml-2">{broadcasts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No broadcasts yet</h3>
              <p className="text-muted-foreground mb-4">Create your first announcement to notify all franchises</p>
              <Button onClick={() => setModalOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcasts.map((broadcast) => (
                    <TableRow key={broadcast.id}>
                      <TableCell>
                        {getPriorityIcon(broadcast.priority)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{broadcast.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {broadcast.message}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(broadcast.priority)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {broadcast.creator?.full_name || 'System'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(broadcast.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Broadcast Modal */}
      <CreateBroadcastModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleBroadcastCreated}
      />
    </div>
  );
}
