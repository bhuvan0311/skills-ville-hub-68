import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { Batch } from '@/lib/supabase';

interface ClassSlot {
  id: string;
  batchName: string;
  level: string;
  time: string;
}

interface WeeklyCalendarProps {
  batches?: Batch[];
  onSlotClick?: (slot: ClassSlot) => void;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayMapping: Record<string, string> = {
  'Monday': 'Mon',
  'Tuesday': 'Tue',
  'Wednesday': 'Wed',
  'Thursday': 'Thu',
  'Friday': 'Fri',
  'Saturday': 'Sat',
};

const levelColors: Record<string, string> = {
  'Level 1': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Level 2': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Level 3': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Level 4': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Level 5': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Level 6': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Level 7': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Level 8': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function parseSchedule(batch: Batch): { days: string[]; time: string } {
  // Parse schedule string like "Monday, Wednesday, Friday • 4:00 PM"
  if (!batch.schedule) return { days: [], time: '' };
  
  const parts = batch.schedule.split('•').map(s => s.trim());
  const daysPart = parts[0] || '';
  const time = parts[1] || '';
  
  // Parse days (could be "Mon, Wed, Fri" or "Monday, Wednesday, Friday")
  const days = daysPart.split(',').map(d => {
    const trimmed = d.trim();
    // Convert full day names to short form
    return dayMapping[trimmed] || trimmed.slice(0, 3);
  }).filter(d => weekDays.includes(d));
  
  return { days, time };
}

export function WeeklyCalendar({ batches = [], onSlotClick }: WeeklyCalendarProps) {
  // Build schedule from batches
  const schedule: Record<string, ClassSlot[]> = {};
  
  weekDays.forEach(day => {
    schedule[day] = [];
  });
  
  batches.forEach(batch => {
    const { days, time } = parseSchedule(batch);
    days.forEach(day => {
      if (schedule[day]) {
        schedule[day].push({
          id: batch.id,
          batchName: batch.name,
          level: `Level ${batch.level}`,
          time: time || 'TBD',
        });
      }
    });
  });

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
                      className={`mt-1 text-[10px] px-1.5 py-0 ${levelColors[slot.level] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {slot.level}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{slot.time}</p>
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
