import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface TeacherCardProps {
  id: string;
  name: string;
  avatar?: string;
  specialization: string;
  certifiedLevels: number;
  totalLevels: number;
  isSelected?: boolean;
  onClick: () => void;
}

export function TeacherCard({
  name,
  avatar,
  specialization,
  certifiedLevels,
  totalLevels,
  isSelected,
  onClick,
}: TeacherCardProps) {
  const progress = (certifiedLevels / totalLevels) * 100;
  const isFullyCertified = certifiedLevels === totalLevels;

  return (
    <Card
      className={`bg-white dark:bg-card cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold truncate">{name}</h4>
              {isFullyCertified && (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{specialization}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Certification</span>
            <Badge variant="secondary" className={isFullyCertified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''}>
              {certifiedLevels}/{totalLevels} Levels
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
