import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeacherCard } from '@/components/training/TeacherCard';
import { CertificationTimeline } from '@/components/training/CertificationTimeline';
import { GraduationCap, Users, Award, TrendingUp } from 'lucide-react';

interface TrainingStep {
  id: string;
  title: string;
  status: 'completed' | 'scheduled' | 'locked';
  completedDate?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  zoomLink?: string;
}

interface Teacher {
  id: string;
  name: string;
  specialization: string;
  certifiedLevels: number;
  totalLevels: number;
  trainingSteps: TrainingStep[];
}

const teachers: Teacher[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    specialization: 'Advanced Mental Arithmetic',
    certifiedLevels: 2,
    totalLevels: 4,
    trainingSteps: [
      {
        id: '1',
        title: 'Level 1 Training',
        status: 'completed',
        completedDate: 'Jan 10, 2024',
      },
      {
        id: '2',
        title: 'Level 2 Training',
        status: 'completed',
        completedDate: 'Jan 25, 2024',
      },
      {
        id: '3',
        title: 'Level 3 Training',
        status: 'scheduled',
        scheduledDate: 'Feb 15th',
        scheduledTime: '10:00 AM',
        zoomLink: 'https://zoom.us/j/123456789',
      },
      {
        id: '4',
        title: 'Level 4 Training',
        status: 'locked',
      },
    ],
  },
  {
    id: '2',
    name: 'Anjali Mehta',
    specialization: 'Beginner Abacus Techniques',
    certifiedLevels: 4,
    totalLevels: 4,
    trainingSteps: [
      {
        id: '1',
        title: 'Level 1 Training',
        status: 'completed',
        completedDate: 'Nov 5, 2023',
      },
      {
        id: '2',
        title: 'Level 2 Training',
        status: 'completed',
        completedDate: 'Nov 20, 2023',
      },
      {
        id: '3',
        title: 'Level 3 Training',
        status: 'completed',
        completedDate: 'Dec 10, 2023',
      },
      {
        id: '4',
        title: 'Level 4 Training',
        status: 'completed',
        completedDate: 'Jan 5, 2024',
      },
    ],
  },
  {
    id: '3',
    name: 'Rahul Verma',
    specialization: 'Competition Preparation',
    certifiedLevels: 3,
    totalLevels: 4,
    trainingSteps: [
      {
        id: '1',
        title: 'Level 1 Training',
        status: 'completed',
        completedDate: 'Dec 1, 2023',
      },
      {
        id: '2',
        title: 'Level 2 Training',
        status: 'completed',
        completedDate: 'Dec 15, 2023',
      },
      {
        id: '3',
        title: 'Level 3 Training',
        status: 'completed',
        completedDate: 'Jan 8, 2024',
      },
      {
        id: '4',
        title: 'Level 4 Training',
        status: 'scheduled',
        scheduledDate: 'Feb 20th',
        scheduledTime: '2:00 PM',
        zoomLink: 'https://zoom.us/j/987654321',
      },
    ],
  },
];

export default function TrainingPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher>(teachers[0]);

  const totalCertifications = teachers.reduce((acc, t) => acc + t.certifiedLevels, 0);
  const avgProgress = Math.round(
    (teachers.reduce((acc, t) => acc + (t.certifiedLevels / t.totalLevels) * 100, 0) /
      teachers.length)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Teacher Training</h1>
        <p className="text-muted-foreground">Track certification progress and manage training schedules</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Teachers</p>
              <p className="text-2xl font-bold">{teachers.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Certifications</p>
              <p className="text-2xl font-bold">{totalCertifications}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Progress</p>
              <p className="text-2xl font-bold">{avgProgress}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teacher List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Teaching Staff
          </h2>
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                {...teacher}
                isSelected={selectedTeacher.id === teacher.id}
                onClick={() => setSelectedTeacher(teacher)}
              />
            ))}
          </div>
        </div>

        {/* Certification Timeline */}
        <Card className="lg:col-span-2 bg-white dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {selectedTeacher.name}'s Training Journey
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedTeacher.specialization}
            </p>
          </CardHeader>
          <CardContent>
            <CertificationTimeline
              steps={selectedTeacher.trainingSteps}
              teacherName={selectedTeacher.name}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
