import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherCard } from '@/components/training/TeacherCard';
import { CertificationTimeline } from '@/components/training/CertificationTimeline';
import { GraduationCap, Users, Award, TrendingUp, Calendar, Video, ExternalLink } from 'lucide-react';

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

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  meeting_link: string;
  description?: string;
}

export default function TrainingPage() {
  const { userProfile } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  const franchiseId = userProfile?.franchise_id;

  useEffect(() => {
    fetchData();
  }, [franchiseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch teachers from franchise
      if (franchiseId) {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('*')
          .eq('franchise_id', franchiseId);

        const mappedTeachers: Teacher[] = (teacherData || []).map((t) => ({
          id: t.id,
          name: t.full_name,
          specialization: t.specialization || 'General Abacus',
          certifiedLevels: 0, // Will be calculated from training completions
          totalLevels: 4,
          trainingSteps: [
            { id: '1', title: 'Level 1 Training', status: 'locked' as const },
            { id: '2', title: 'Level 2 Training', status: 'locked' as const },
            { id: '3', title: 'Level 3 Training', status: 'locked' as const },
            { id: '4', title: 'Level 4 Training', status: 'locked' as const },
          ],
        }));

        setTeachers(mappedTeachers);
        if (mappedTeachers.length > 0) {
          setSelectedTeacher(mappedTeachers[0]);
        }
      }

      // Fetch upcoming training sessions
      const { data: sessionData } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5);

      setSessions(sessionData || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
      // Tables might not exist yet
      setTeachers([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const totalCertifications = teachers.reduce((acc, t) => acc + t.certifiedLevels, 0);
  const avgProgress = teachers.length > 0 
    ? Math.round(teachers.reduce((acc, t) => acc + (t.certifiedLevels / t.totalLevels) * 100, 0) / teachers.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Teacher Training</h1>
        <p className="text-muted-foreground">Track certification progress and manage training schedules</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Teachers</p>
              <p className="text-2xl font-bold">{loading ? '...' : teachers.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <Award className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Certifications</p>
              <p className="text-2xl font-bold">{loading ? '...' : totalCertifications}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Progress</p>
              <p className="text-2xl font-bold">{loading ? '...' : `${avgProgress}%`}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <Calendar className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
              <p className="text-2xl font-bold">{loading ? '...' : sessions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Training Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Upcoming Training Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No upcoming training sessions scheduled.</p>
              <p className="text-sm">Check back later for new sessions from HQ.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(session.meeting_link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Join
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content - Split View */}
      {teachers.length > 0 && selectedTeacher && (
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
          <Card className="lg:col-span-2">
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
      )}

      {!loading && teachers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Teachers Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add teachers from the Teachers page to track their training progress.
            </p>
            <Button onClick={() => window.location.href = '/franchise/teachers'}>
              Go to Teachers
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
