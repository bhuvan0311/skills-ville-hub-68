import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BatchCard } from '@/components/schedule/BatchCard';
import { AttendanceModal } from '@/components/schedule/AttendanceModal';
import { AddClassModal } from '@/components/schedule/AddClassModal';
import { WeeklyCalendar } from '@/components/schedule/WeeklyCalendar';
import { Plus, Users, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getBatchesWithStudentCount, 
  getStudentsForBatch,
  Batch 
} from '@/lib/supabase';

interface BatchWithStudents extends Batch {
  id: string;
  name: string;
  level: number;
  schedule?: string;
  max_students: number;
  student_count?: number;
  teacher: string;
  students: {
    id: string;
    name: string;
    parentPhone: string;
  }[];
}

export default function SchedulePage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const franchiseId = userProfile?.franchise_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const [batches, setBatches] = useState<BatchWithStudents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchWithStudents | null>(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const batchesData = await getBatchesWithStudentCount(franchiseId);
      
      // Fetch students for each batch
      const batchesWithStudents = await Promise.all(
        batchesData.map(async (batch) => {
          const students = await getStudentsForBatch(batch.id);
          return {
            ...batch,
            teacher: 'Assigned Teacher', // Default until we add teacher field
            students,
          } as BatchWithStudents;
        })
      );

      setBatches(batchesWithStudents);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load batches. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [franchiseId]);

  const handleBatchClick = async (batch: BatchWithStudents) => {
    setSelectedBatch(batch);
    setShowAttendance(true);
  };

  const handleBatchCreated = () => {
    fetchBatches();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Batches & Schedule</h1>
          <p className="text-muted-foreground">Manage your class batches and attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchBatches}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowAddClass(true)} className="gap-2 shadow-glow">
            <Plus className="h-4 w-4" />
            Add Batch
          </Button>
        </div>
      </div>

      {/* Active Batches Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Active Batches
        </h2>
        {batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                id={batch.id}
                name={batch.name}
                level={`Level ${batch.level}`}
                studentsPresent={batch.student_count || 0}
                totalStudents={batch.max_students}
                schedule={batch.schedule || 'No schedule set'}
                teacher={batch.teacher}
                isActive={selectedBatch?.id === batch.id}
                onClick={() => handleBatchClick(batch)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Batches Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first batch to get started</p>
            <Button onClick={() => setShowAddClass(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Batch
            </Button>
          </div>
        )}
      </div>

      {/* Weekly Calendar Section */}
      <WeeklyCalendar batches={batches} />

      {/* Attendance Modal */}
      {selectedBatch && (
        <AttendanceModal
          open={showAttendance}
          onOpenChange={setShowAttendance}
          batchName={selectedBatch.name}
          batchLevel={`Level ${selectedBatch.level}`}
          students={selectedBatch.students}
        />
      )}

      {/* Add Class Modal */}
      <AddClassModal 
        open={showAddClass} 
        onOpenChange={setShowAddClass}
        franchiseId={franchiseId}
        onSuccess={handleBatchCreated}
      />
    </div>
  );
}
