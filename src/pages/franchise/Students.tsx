import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudentKYCModal } from "@/components/students/StudentKYCModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStudents,
  getBatches,
  updateStudentStatus,
  Student,
  Batch,
  StudentStatus,
} from "@/lib/supabase";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function StudentsPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const franchiseId = userProfile?.franchise_id;

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [studentsData, batchesData] = await Promise.all([
        getStudents(franchiseId),
        getBatches(franchiseId),
      ]);

      setStudents(studentsData);
      setBatches(batchesData);
    } catch {
      setStudents([]);
      setBatches([]);
      setLoadError(
        "Unable to load students. Check the database connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [franchiseId]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      student.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesLevel =
      levelFilter === "all" || student.level.toString() === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleDeactivateStudent = async () => {
    if (!selectedStudent) return;

    try {
      const success = await updateStudentStatus(selectedStudent.id, "DROPOUT");

      if (success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedStudent.id
              ? { ...s, status: "DROPOUT" as StudentStatus }
              : s,
          ),
        );
        toast({
          title: "Student Deactivated",
          description: `${selectedStudent.full_name} has been marked as dropout.`,
        });
      } else {
        throw new Error("Student status was not saved.");
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Student status was not saved. Please retry.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const getStatusBadge = (status: StudentStatus) => {
    const variants: Record<StudentStatus, string> = {
      ACTIVE: "bg-success/10 text-success border-success/30",
      INACTIVE: "bg-muted text-muted-foreground border-muted",
      PENDING: "bg-warning/10 text-warning border-warning/30",
      DROPOUT: "bg-destructive/10 text-destructive border-destructive/30",
      GRADUATED: "bg-primary/10 text-primary border-primary/30",
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const getLevelBadge = (level: number) => {
    const colors = [
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    ];
    return (
      <Badge
        variant="secondary"
        className={colors[(level - 1) % colors.length]}
      >
        Level {level}
      </Badge>
    );
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
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            disabled={!franchiseId || Boolean(loadError)}
            onClick={() => setKycModalOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 p-4 text-destructive"
        >
          {loadError}
        </div>
      )}

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
                  <SelectItem value="dropout">Dropout</SelectItem>
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
                    <TableCell className="font-mono text-xs">
                      {student.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={student.photo_url}
                            alt={student.full_name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {student.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {student.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {student.parent_phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(student.level)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {student.batch?.name || "Unassigned"}
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {student.parent_name}
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
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedStudent(student);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate Student
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
        onSuccess={fetchData}
        franchiseId={franchiseId || ""}
        batches={batches}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark {selectedStudent?.full_name} as a dropout. They
              will no longer appear in active student lists. This action can be
              reversed by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateStudent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
