import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface ClassSlot {
  id: string;
  batchName: string;
  level: string;
  time: string;
  teacher: string;
}

interface WeeklyCalendarProps {
  onSlotClick?: (slot: ClassSlot) => void;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const schedule: Record<string, ClassSlot[]> = {
  Mon: [
    { id: '1', batchName: 'Batch A', level: 'Level 1', time: '4:00 PM', teacher: 'Priya' },
    { id: '2', batchName: 'Batch B', level: 'Level 3', time: '5:00 PM', teacher: 'Priya' },
  ],
  Tue: [
    { id: '3', batchName: 'Batch C', level: 'Level 2', time: '3:00 PM', teacher: 'Anjali' },
  ],
  Wed: [
    { id: '4', batchName: 'Batch A', level: 'Level 1', time: '4:00 PM', teacher: 'Priya' },
    { id: '5', batchName: 'Batch D', level: 'Level 4', time: '5:00 PM', teacher: 'Rahul' },
  ],
  Thu: [
    { id: '6', batchName: 'Batch B', level: 'Level 3', time: '4:00 PM', teacher: 'Priya' },
  ],
  Fri: [
    { id: '7', batchName: 'Batch C', level: 'Level 2', time: '3:00 PM', teacher: 'Anjali' },
    { id: '8', batchName: 'Batch A', level: 'Level 1', time: '4:00 PM', teacher: 'Priya' },
  ],
  Sat: [
    { id: '9', batchName: 'Batch D', level: 'Level 4', time: '10:00 AM', teacher: 'Rahul' },
    { id: '10', batchName: 'Batch B', level: 'Level 3', time: '11:00 AM', teacher: 'Priya' },
  ],
};

const levelColors: Record<string, string> = {
  'Level 1': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Level 2': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Level 3': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Level 4': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export function WeeklyCalendar({ onSlotClick }: WeeklyCalendarProps) {
  return (
    <Card className="bg-white dark:bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Weekly Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-3">
          {weekDays.map((day) => (
            <div key={day} className="space-y-2">
              <div className="text-center py-2 bg-muted/50 rounded-lg font-medium text-sm">
                {day}
              </div>
              <div className="space-y-2 min-h-[200px]">
                {schedule[day]?.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-2 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onSlotClick?.(slot)}
                  >
                    <p className="font-medium text-xs truncate">{slot.batchName}</p>
                    <Badge
                      variant="secondary"
                      className={`mt-1 text-[10px] px-1.5 py-0 ${levelColors[slot.level]}`}
                    >
                      {slot.level}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{slot.time}</p>
                    <p className="text-[10px] text-muted-foreground">{slot.teacher}</p>
                  </div>
                ))}
                {(!schedule[day] || schedule[day].length === 0) && (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No classes
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
