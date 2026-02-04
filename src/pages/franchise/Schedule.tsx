import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BatchCard } from '@/components/schedule/BatchCard';
import { AttendanceModal } from '@/components/schedule/AttendanceModal';
import { AddClassModal } from '@/components/schedule/AddClassModal';
import { WeeklyCalendar } from '@/components/schedule/WeeklyCalendar';
import { Plus, Users } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  level: string;
  studentsPresent: number;
  totalStudents: number;
  schedule: string;
  teacher: string;
  students: {
    id: string;
    name: string;
    parentPhone: string;
  }[];
}

const batches: Batch[] = [
  {
    id: '1',
    name: 'Batch A',
    level: 'Level 1',
    studentsPresent: 12,
    totalStudents: 15,
    schedule: 'Mon, Wed, Fri • 4:00 PM',
    teacher: 'Priya Sharma',
    students: [
      { id: '1', name: 'Aarav Patel', parentPhone: '+91 98765 43210' },
      { id: '2', name: 'Diya Sharma', parentPhone: '+91 98765 43211' },
      { id: '3', name: 'Vihaan Singh', parentPhone: '+91 98765 43212' },
      { id: '4', name: 'Ananya Gupta', parentPhone: '+91 98765 43213' },
      { id: '5', name: 'Arjun Kumar', parentPhone: '+91 98765 43214' },
      { id: '6', name: 'Ishaan Mehta', parentPhone: '+91 98765 43215' },
      { id: '7', name: 'Saanvi Reddy', parentPhone: '+91 98765 43216' },
      { id: '8', name: 'Reyansh Joshi', parentPhone: '+91 98765 43217' },
      { id: '9', name: 'Aanya Verma', parentPhone: '+91 98765 43218' },
      { id: '10', name: 'Vivaan Iyer', parentPhone: '+91 98765 43219' },
      { id: '11', name: 'Myra Desai', parentPhone: '+91 98765 43220' },
      { id: '12', name: 'Kabir Nair', parentPhone: '+91 98765 43221' },
      { id: '13', name: 'Kiara Rao', parentPhone: '+91 98765 43222' },
      { id: '14', name: 'Aditya Menon', parentPhone: '+91 98765 43223' },
      { id: '15', name: 'Prisha Shah', parentPhone: '+91 98765 43224' },
    ],
  },
  {
    id: '2',
    name: 'Batch B',
    level: 'Level 3',
    studentsPresent: 10,
    totalStudents: 12,
    schedule: 'Mon, Thu, Sat • 5:00 PM',
    teacher: 'Priya Sharma',
    students: [
      { id: '16', name: 'Advait Pillai', parentPhone: '+91 98765 43225' },
      { id: '17', name: 'Navya Bhat', parentPhone: '+91 98765 43226' },
      { id: '18', name: 'Dhruv Kapoor', parentPhone: '+91 98765 43227' },
      { id: '19', name: 'Ira Saxena', parentPhone: '+91 98765 43228' },
      { id: '20', name: 'Yash Malhotra', parentPhone: '+91 98765 43229' },
      { id: '21', name: 'Avni Bajaj', parentPhone: '+91 98765 43230' },
      { id: '22', name: 'Arnav Khanna', parentPhone: '+91 98765 43231' },
      { id: '23', name: 'Pari Choudhary', parentPhone: '+91 98765 43232' },
      { id: '24', name: 'Shaurya Goel', parentPhone: '+91 98765 43233' },
      { id: '25', name: 'Tara Agarwal', parentPhone: '+91 98765 43234' },
      { id: '26', name: 'Om Srivastava', parentPhone: '+91 98765 43235' },
      { id: '27', name: 'Sia Bansal', parentPhone: '+91 98765 43236' },
    ],
  },
  {
    id: '3',
    name: 'Batch C',
    level: 'Level 2',
    studentsPresent: 8,
    totalStudents: 10,
    schedule: 'Tue, Fri • 3:00 PM',
    teacher: 'Anjali Mehta',
    students: [
      { id: '28', name: 'Rudra Tandon', parentPhone: '+91 98765 43237' },
      { id: '29', name: 'Ahana Chopra', parentPhone: '+91 98765 43238' },
      { id: '30', name: 'Krishna Mishra', parentPhone: '+91 98765 43239' },
      { id: '31', name: 'Zara Sinha', parentPhone: '+91 98765 43240' },
      { id: '32', name: 'Aarush Dhawan', parentPhone: '+91 98765 43241' },
      { id: '33', name: 'Aira Bose', parentPhone: '+91 98765 43242' },
      { id: '34', name: 'Ved Pandey', parentPhone: '+91 98765 43243' },
      { id: '35', name: 'Mishka Roy', parentPhone: '+91 98765 43244' },
      { id: '36', name: 'Ayaan Das', parentPhone: '+91 98765 43245' },
      { id: '37', name: 'Riya Sen', parentPhone: '+91 98765 43246' },
    ],
  },
  {
    id: '4',
    name: 'Batch D',
    level: 'Level 4',
    studentsPresent: 6,
    totalStudents: 8,
    schedule: 'Wed, Sat • 10:00 AM',
    teacher: 'Rahul Verma',
    students: [
      { id: '38', name: 'Atharv Mathur', parentPhone: '+91 98765 43247' },
      { id: '39', name: 'Nyra Guha', parentPhone: '+91 98765 43248' },
      { id: '40', name: 'Virat Kulkarni', parentPhone: '+91 98765 43249' },
      { id: '41', name: 'Anaisha Dutta', parentPhone: '+91 98765 43250' },
      { id: '42', name: 'Sai Hegde', parentPhone: '+91 98765 43251' },
      { id: '43', name: 'Anvi Chatterjee', parentPhone: '+91 98765 43252' },
      { id: '44', name: 'Daksh Bhattacharya', parentPhone: '+91 98765 43253' },
      { id: '45', name: 'Mira Jain', parentPhone: '+91 98765 43254' },
    ],
  },
];

export default function SchedulePage() {
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);

  const handleBatchClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowAttendance(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batches & Schedule</h1>
          <p className="text-muted-foreground">Manage your class batches and attendance</p>
        </div>
        <Button onClick={() => setShowAddClass(true)} className="gap-2 shadow-glow">
          <Plus className="h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Active Batches Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Active Batches
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              {...batch}
              isActive={selectedBatch?.id === batch.id}
              onClick={() => handleBatchClick(batch)}
            />
          ))}
        </div>
      </div>

      {/* Weekly Calendar Section */}
      <WeeklyCalendar />

      {/* Attendance Modal */}
      {selectedBatch && (
        <AttendanceModal
          open={showAttendance}
          onOpenChange={setShowAttendance}
          batchName={selectedBatch.name}
          batchLevel={selectedBatch.level}
          students={selectedBatch.students}
        />
      )}

      {/* Add Class Modal */}
      <AddClassModal open={showAddClass} onOpenChange={setShowAddClass} />
    </div>
  );
}
