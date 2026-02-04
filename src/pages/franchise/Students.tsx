import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudentKYCModal, StudentKYCData } from '@/components/students/StudentKYCModal';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  photo?: string;
  level: number;
  batch: string;
  status: 'active' | 'inactive' | 'pending';
  parentName: string;
  phone: string;
  joinedDate: string;
}

const mockStudents: Student[] = [
  {
    id: 'STU001',
    name: 'Aarav Sharma',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    level: 3,
    batch: 'Batch A - Morning',
    status: 'active',
    parentName: 'Rajesh Sharma',
    phone: '+91 99***12345',
    joinedDate: '2024-01-15',
  },
  {
    id: 'STU002',
    name: 'Priya Patel',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    level: 2,
    batch: 'Batch B - Afternoon',
    status: 'active',
    parentName: 'Meera Patel',
    phone: '+91 98***67890',
    joinedDate: '2024-02-20',
  },
  {
    id: 'STU003',
    name: 'Arjun Kumar',
    level: 1,
    batch: 'Batch A - Morning',
    status: 'pending',
    parentName: 'Suresh Kumar',
    phone: '+91 97***54321',
    joinedDate: '2024-03-10',
  },
  {
    id: 'STU004',
    name: 'Ananya Reddy',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    level: 4,
    batch: 'Batch C - Evening',
    status: 'active',
    parentName: 'Lakshmi Reddy',
    phone: '+91 96***98765',
    joinedDate: '2023-11-05',
  },
  {
    id: 'STU005',
    name: 'Rohan Gupta',
    level: 2,
    batch: 'Batch B - Afternoon',
    status: 'inactive',
    parentName: 'Vikram Gupta',
    phone: '+91 95***11111',
    joinedDate: '2024-01-25',
  },
];

const needsAttentionItems = [
  {
    id: '1',
    title: 'Batch A completed 12 weeks',
    description: '8 students ready for Level 2 assessment',
    type: 'exam',
  },
  {
    id: '2',
    title: '3 students with low attendance',
    description: 'Arjun, Priya, Rohan - below 75% attendance',
    type: 'attendance',
  },
];

export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || student.level.toString() === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleAddStudent = (data: StudentKYCData) => {
    const newStudent: Student = {
      id: `STU${String(students.length + 1).padStart(3, '0')}`,
      name: data.name,
      photo: data.photo,
      level: 1,
      batch: 'Batch A - Morning',
      status: 'pending',
      parentName: data.parentName,
      phone: `+91 ${data.phone.slice(0, 2)}***${data.phone.slice(-5)}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setStudents((prev) => [newStudent, ...prev]);
    toast({
      title: 'Student Enrolled!',
      description: `${data.name} has been successfully enrolled.`,
    });
  };

  const handleScheduleExam = () => {
    toast({
      title: 'Exam Scheduled',
      description: 'Level assessment exam scheduled for Batch A students.',
    });
  };

  const handleRemedialClass = () => {
    toast({
      title: 'Remedial Class Scheduled',
      description: 'Extra practice session scheduled for struggling students.',
    });
  };

  const getStatusBadge = (status: Student['status']) => {
    const variants = {
      active: 'bg-success/10 text-success border-success/30',
      inactive: 'bg-muted text-muted-foreground border-muted',
      pending: 'bg-warning/10 text-warning border-warning/30',
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getLevelBadge = (level: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    ];
    return (
      <Badge variant="secondary" className={colors[(level - 1) % colors.length]}>
        Level {level}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Student Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage enrollments, track progress, and monitor attendance
          </p>
        </div>
        <Button onClick={() => setKycModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Needs Attention Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {needsAttentionItems.map((item) => (
          <Card key={item.id} className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                  {item.type === 'exam' ? (
                    <GraduationCap className="h-5 w-5 text-warning" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  <div className="flex gap-2 mt-3">
                    {item.type === 'exam' ? (
                      <>
                        <Button size="sm" onClick={handleScheduleExam}>
                          Schedule Exam
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleRemedialClass}>
                          Remedial Class
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm">Send Reminder</Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="hidden md:table-cell">Batch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Parent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs">{student.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.photo} alt={student.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {student.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {student.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(student.level)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {student.batch}
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {student.parentName}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Progress Report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No students found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Modal */}
      <StudentKYCModal
        open={kycModalOpen}
        onOpenChange={setKycModalOpen}
        onSubmit={handleAddStudent}
      />
    </div>
  );
}
