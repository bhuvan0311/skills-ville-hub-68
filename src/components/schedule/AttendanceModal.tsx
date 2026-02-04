import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Save } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  avatar?: string;
  parentPhone: string;
}

interface AttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchName: string;
  batchLevel: string;
  students: Student[];
}

export function AttendanceModal({
  open,
  onOpenChange,
  batchName,
  batchLevel,
  students,
}: AttendanceModalProps) {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    students.reduce((acc, student) => ({ ...acc, [student.id]: true }), {})
  );

  const handleToggle = (studentId: string, studentName: string, isPresent: boolean) => {
    setAttendance((prev) => ({ ...prev, [studentId]: isPresent }));

    if (!isPresent) {
      toast({
        title: '✓ Automatic WhatsApp update sent to Parent',
        description: `Absence notification sent for ${studentName}`,
        className: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
      });
    }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{batchName}</DialogTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {batchLevel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Mark attendance for today's class
          </p>
        </DialogHeader>

        <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg mb-4">
          <span className="text-sm font-medium">Present Today</span>
          <Badge variant="outline" className="text-lg font-semibold">
            {presentCount}/{students.length}
          </Badge>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  attendance[student.id]
                    ? 'bg-green-50/50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                    : 'bg-red-50/50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {student.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Parent: {student.parentPhone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${
                      attendance[student.id] ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {attendance[student.id] ? 'Present' : 'Absent'}
                  </span>
                  <Switch
                    checked={attendance[student.id]}
                    onCheckedChange={(checked) =>
                      handleToggle(student.id, student.name, checked)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)} className="gap-2">
            <Save className="h-4 w-4" />
            Save Attendance
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
