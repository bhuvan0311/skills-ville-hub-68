import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2, Megaphone } from 'lucide-react';
import { createBroadcast, BroadcastPriority } from '@/lib/broadcastQueries';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateBroadcastModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBroadcastModal({ open, onClose, onCreated }: CreateBroadcastModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'NORMAL' as BroadcastPriority,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a broadcast');
      return;
    }

    setLoading(true);
    try {
      await createBroadcast({
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        created_by: user.id,
      });

      toast.success('Broadcast sent to all franchises!');
      setFormData({ title: '', message: '', priority: 'NORMAL' });
      onCreated();
    } catch (error) {
      console.error('Error creating broadcast:', error);
      toast.error('Failed to create broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            New Announcement
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., New Training Material Available"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter your announcement message..."
              rows={4}
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: BroadcastPriority) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Urgent/Critical Warning */}
          {(formData.priority === 'URGENT' || formData.priority === 'CRITICAL') && (
            <div className={`flex items-start gap-3 p-3 rounded-lg ${
              formData.priority === 'CRITICAL' 
                ? 'bg-destructive/10 border border-destructive/30' 
                : 'bg-warning/10 border border-warning/30'
            }`}>
              <AlertTriangle className={`h-5 w-5 shrink-0 ${
                formData.priority === 'CRITICAL' ? 'text-destructive' : 'text-warning'
              }`} />
              <div className="text-sm">
                <p className={`font-medium ${
                  formData.priority === 'CRITICAL' ? 'text-destructive' : 'text-warning'
                }`}>
                  {formData.priority === 'CRITICAL' ? 'Critical Alert' : 'Urgent Notice'}
                </p>
                <p className="text-muted-foreground">
                  This message will be highlighted prominently to all franchise owners.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
