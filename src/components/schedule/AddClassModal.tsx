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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Plus } from 'lucide-react';

interface AddClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const teachers = [
  { id: '1', name: 'Priya Sharma' },
  { id: '2', name: 'Anjali Mehta' },
  { id: '3', name: 'Rahul Verma' },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

// Mock existing schedule - Priya has a class on Monday 5 PM
const existingSchedule = [
  { teacher: 'Priya Sharma', day: 'Monday', time: '5:00 PM', batch: 'Batch B1' },
  { teacher: 'Anjali Mehta', day: 'Tuesday', time: '3:00 PM', batch: 'Batch A2' },
];

export function AddClassModal({ open, onOpenChange }: AddClassModalProps) {
  const [batchName, setBatchName] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const conflict = existingSchedule.find(
    (s) => s.teacher === selectedTeacher && s.day === selectedDay && s.time === selectedTime
  );

  const handleSubmit = () => {
    if (!conflict) {
      onOpenChange(false);
      // Reset form
      setBatchName('');
      setSelectedTeacher('');
      setSelectedDay('');
      setSelectedTime('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Class
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="batch-name">Batch Name</Label>
            <Input
              id="batch-name"
              placeholder="e.g., Batch C (Level 2)"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign Teacher</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.name}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          {conflict && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Scheduling Conflict</AlertTitle>
              <AlertDescription>
                Conflict: Teacher {conflict.teacher} is already assigned to {conflict.batch} at this time.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!!conflict || !batchName || !selectedTeacher || !selectedDay || !selectedTime}>
            Create Class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
