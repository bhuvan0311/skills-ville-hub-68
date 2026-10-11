import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  GraduationCap,
  Save,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const PASS_MARK = 70;

export default function BatchExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { userProfile } = useAuth();
  const [batch, setBatch] = useState<{
    name: string;
    level: number;
    franchise_id: string;
    students: { id: string; name: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let live = true;
    setLoading(true);
    setLoadError("");
    setBatch(null);
    const load = async () => {
      if (!id) throw new Error("No batch selected.");
      const { data: record, error: batchError } = await supabase
        .from("batches")
        .select("id,name,level,franchise_id")
        .eq("id", id)
        .maybeSingle();
      if (batchError || !record) throw new Error("Batch could not be loaded.");
      const { data: students, error } = await supabase
        .from("students")
        .select("id,full_name")
        .eq("batch_id", id)
        .eq("franchise_id", record.franchise_id)
        .eq("status", "ACTIVE");
      if (error) throw new Error("Students could not be loaded.");
      if (live) {
        setBatch({
          ...record,
          students: (students || []).map((student) => ({
            id: student.id,
            name: student.full_name,
          })),
        });
        setMarks(
          Object.fromEntries(
            (students || []).map((student) => [student.id, ""]),
          ),
        );
      }
    };
    load()
      .catch((e) => {
        if (live) setLoadError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id, userProfile?.franchise_id]);

  const [marks, setMarks] = useState<Record<string, number | "">>(() => {
    if (!batch) return {};
    return batch.students.reduce(
      (acc, student) => {
        acc[student.id] = "";
        return acc;
      },
      {} as Record<string, number | "">,
    );
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <p role="status">Loading batch…</p>;
  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">
          {loadError || "Batch not found"}
        </p>
        <Button onClick={() => navigate("/franchise/schedule")}>
          Go Back to Schedule
        </Button>
      </div>
    );
  }

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue =
      value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setMarks((prev) => ({ ...prev, [studentId]: numValue }));
  };

  const getMarkStatus = (mark: number | "") => {
    if (mark === "") return null;
    return mark >= PASS_MARK ? "pass" : "fail";
  };

  const handleSubmit = async () => {
    const hasEmptyMarks =
      batch.students.length === 0 ||
      Object.values(marks).some((m) => m === "" || !Number.isFinite(m));
    if (hasEmptyMarks) {
      toast({
        title: "Incomplete Marks",
        description: "Please enter marks for all students before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const franchiseId = batch.franchise_id;
      if (!franchiseId) throw new Error("No franchise assigned.");

      // Prepare exam results for insertion
      const examResults = batch.students.map((student) => ({
        student_id: student.id,
        franchise_id: franchiseId,
        level: batch.level,
        marks_obtained: Number(marks[student.id]),
        is_passed: Number(marks[student.id]) >= PASS_MARK,
        certificate_status:
          Number(marks[student.id]) >= PASS_MARK ? "PENDING" : null,
        exam_date: new Date().toISOString().split("T")[0],
      }));

      // Insert exam results into Supabase
      const { error } = await supabase.from("exam_results").insert(examResults);

      if (error) throw error;

      const passedCount = Object.values(marks).filter(
        (m) => Number(m) >= PASS_MARK,
      ).length;
      const failedCount = batch.students.length - passedCount;

      toast({
        title: "Results Submitted Successfully",
        description: `${passedCount} students passed, ${failedCount} need remedial classes. Certificates flagged for passed students.`,
      });

      navigate("/franchise/schedule");
    } catch (error) {
      console.error("Error submitting marks:", error);
      toast({
        title: "Error",
        description: "Failed to submit results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const passedCount = Object.values(marks).filter(
    (m) => m !== "" && Number(m) >= PASS_MARK,
  ).length;
  const failedCount = Object.values(marks).filter(
    (m) => m !== "" && Number(m) < PASS_MARK,
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/franchise/schedule")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Enter Marks for {batch.name} - Level {batch.level}
          </h1>
          <p className="text-muted-foreground">
            Pass mark: {PASS_MARK}% • Total students: {batch.students.length}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold text-foreground">
                {batch.students.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(passedCount > 0 && "border-success/30 bg-success/5")}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Passed</p>
              <p className="text-3xl font-bold text-success">{passedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            failedCount > 0 && "border-destructive/30 bg-destructive/5",
          )}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Needs Remedial</p>
              <p className="text-3xl font-bold text-destructive">
                {failedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marks Entry Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Marks Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-40">Marks Obtained</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.students.map((student, index) => {
                const status = getMarkStatus(marks[student.id]);
                return (
                  <TableRow
                    key={student.id}
                    className={cn(
                      "transition-colors",
                      status === "pass" && "bg-success/10",
                      status === "fail" && "bg-destructive/10",
                    )}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={marks[student.id]}
                        onChange={(e) =>
                          handleMarkChange(student.id, e.target.value)
                        }
                        placeholder="Enter marks"
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {status === "pass" && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Passed
                        </Badge>
                      )}
                      {status === "fail" && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                      {status === null && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/franchise/schedule")}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-2 shadow-glow"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Submit Results
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
