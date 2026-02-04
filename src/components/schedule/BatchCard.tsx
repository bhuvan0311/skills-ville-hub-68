import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, Calendar } from 'lucide-react';

interface BatchCardProps {
  id: string;
  name: string;
  level: string;
  studentsPresent: number;
  totalStudents: number;
  schedule: string;
  teacher: string;
  isActive?: boolean;
  onClick: () => void;
}

export function BatchCard({
  name,
  level,
  studentsPresent,
  totalStudents,
  schedule,
  teacher,
  isActive,
  onClick,
}: BatchCardProps) {
  const progress = (studentsPresent / totalStudents) * 100;

  return (
    <Card
      className={`bg-white dark:bg-card cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
        isActive ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{teacher}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{schedule}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Attendance</span>
            <span className="font-medium">{studentsPresent}/{totalStudents} Students</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
