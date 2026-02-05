import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createBatch } from '@/lib/supabase';

interface AddClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  franchiseId: string;
  onSuccess: () => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const levels = [1, 2, 3, 4, 5, 6, 7, 8];

export function AddClassModal({ open, onOpenChange, franchiseId, onSuccess }: AddClassModalProps) {
  const { toast } = useToast();
  const [batchName, setBatchName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [maxStudents, setMaxStudents] = useState('15');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const resetForm = () => {
    setBatchName('');
    setSelectedLevel('');
    setSelectedDays([]);
    setSelectedTime('');
    setMaxStudents('15');
  };

  const handleSubmit = async () => {
    if (!batchName || !selectedLevel || selectedDays.length === 0 || !selectedTime) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Build schedule string from selected days and time
      const schedule = `${selectedDays.join(', ')} • ${selectedTime}`;

      await createBatch({
        franchise_id: franchiseId,
        name: batchName.trim(),
        level: parseInt(selectedLevel),
        schedule,
        max_students: parseInt(maxStudents) || 15,
      });

      toast({
        title: 'Batch Created!',
        description: `${batchName} has been created successfully.`,
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to create batch. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Batch
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="batch-name">Batch Name</Label>
            <Input
              id="batch-name"
              placeholder="e.g., Morning Batch A"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Level {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class Days</Label>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={selectedDays.includes(day) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleDay(day)}
                  className="text-xs"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Time Slot</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-students">Max Students</Label>
            <Input
              id="max-students"
              type="number"
              min={1}
              max={30}
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !batchName || !selectedLevel || selectedDays.length === 0 || !selectedTime}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Batch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
