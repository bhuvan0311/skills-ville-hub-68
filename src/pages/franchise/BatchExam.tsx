 import React, { useState } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { ArrowLeft, GraduationCap, Save, CheckCircle, XCircle } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useToast } from '@/hooks/use-toast';
 
 // Mock batch data - In production, fetch from Supabase based on batch ID
 const mockBatchData = {
   '1': {
     name: 'Batch A',
     level: 1,
     students: [
       { id: '1', name: 'Aarav Patel' },
       { id: '2', name: 'Diya Sharma' },
       { id: '3', name: 'Vihaan Singh' },
       { id: '4', name: 'Ananya Gupta' },
       { id: '5', name: 'Arjun Kumar' },
       { id: '6', name: 'Ishaan Mehta' },
       { id: '7', name: 'Saanvi Reddy' },
       { id: '8', name: 'Reyansh Joshi' },
     ],
   },
   '2': {
     name: 'Batch B',
     level: 3,
     students: [
       { id: '16', name: 'Advait Pillai' },
       { id: '17', name: 'Navya Bhat' },
       { id: '18', name: 'Dhruv Kapoor' },
       { id: '19', name: 'Ira Saxena' },
       { id: '20', name: 'Yash Malhotra' },
     ],
   },
   '3': {
     name: 'Batch C',
     level: 2,
     students: [
       { id: '28', name: 'Rudra Tandon' },
       { id: '29', name: 'Ahana Chopra' },
       { id: '30', name: 'Krishna Mishra' },
       { id: '31', name: 'Zara Sinha' },
     ],
   },
 };
 
 const PASS_MARK = 70;
 
 export default function BatchExamPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { toast } = useToast();
   
   const batch = mockBatchData[id as keyof typeof mockBatchData];
   
   const [marks, setMarks] = useState<Record<string, number | ''>>(() => {
     if (!batch) return {};
     return batch.students.reduce((acc, student) => {
       acc[student.id] = '';
       return acc;
     }, {} as Record<string, number | ''>);
   });
 
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   if (!batch) {
     return (
       <div className="flex flex-col items-center justify-center h-64 gap-4">
         <p className="text-muted-foreground">Batch not found</p>
         <Button onClick={() => navigate('/franchise/schedule')}>
           Go Back to Schedule
         </Button>
       </div>
     );
   }
 
   const handleMarkChange = (studentId: string, value: string) => {
     const numValue = value === '' ? '' : Math.min(100, Math.max(0, Number(value)));
     setMarks((prev) => ({ ...prev, [studentId]: numValue }));
   };
 
   const getMarkStatus = (mark: number | '') => {
     if (mark === '') return null;
     return mark >= PASS_MARK ? 'pass' : 'fail';
   };
 
   const handleSubmit = async () => {
     const hasEmptyMarks = Object.values(marks).some((m) => m === '');
     if (hasEmptyMarks) {
       toast({
         title: 'Incomplete Marks',
         description: 'Please enter marks for all students before submitting.',
         variant: 'destructive',
       });
       return;
     }
 
     setIsSubmitting(true);
     await new Promise((resolve) => setTimeout(resolve, 1000));
 
     const passedCount = Object.values(marks).filter((m) => Number(m) >= PASS_MARK).length;
     const failedCount = batch.students.length - passedCount;
 
     toast({
       title: 'Results Submitted Successfully',
       description: `${passedCount} students passed, ${failedCount} need remedial classes. Certificates flagged for passed students.`,
     });
 
     setIsSubmitting(false);
     navigate('/franchise/schedule');
   };
 
   const passedCount = Object.values(marks).filter((m) => m !== '' && Number(m) >= PASS_MARK).length;
   const failedCount = Object.values(marks).filter((m) => m !== '' && Number(m) < PASS_MARK).length;
 
   return (
     <div className="space-y-6 animate-fade-in">
       {/* Header */}
       <div className="flex items-center gap-4">
         <Button
           variant="ghost"
           size="icon"
           onClick={() => navigate('/franchise/schedule')}
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
               <p className="text-3xl font-bold text-foreground">{batch.students.length}</p>
             </div>
           </CardContent>
         </Card>
         <Card className={cn(passedCount > 0 && 'border-success/30 bg-success/5')}>
           <CardContent className="pt-6">
             <div className="text-center">
               <p className="text-sm text-muted-foreground">Passed</p>
               <p className="text-3xl font-bold text-success">{passedCount}</p>
             </div>
           </CardContent>
         </Card>
         <Card className={cn(failedCount > 0 && 'border-destructive/30 bg-destructive/5')}>
           <CardContent className="pt-6">
             <div className="text-center">
               <p className="text-sm text-muted-foreground">Needs Remedial</p>
               <p className="text-3xl font-bold text-destructive">{failedCount}</p>
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
                       'transition-colors',
                       status === 'pass' && 'bg-success/10',
                       status === 'fail' && 'bg-destructive/10'
                     )}
                   >
                     <TableCell className="font-medium">{index + 1}</TableCell>
                     <TableCell className="font-medium">{student.name}</TableCell>
                     <TableCell>
                       <Input
                         type="number"
                         min={0}
                         max={100}
                         value={marks[student.id]}
                         onChange={(e) => handleMarkChange(student.id, e.target.value)}
                         placeholder="Enter marks"
                         className="w-32"
                       />
                     </TableCell>
                     <TableCell className="text-center">
                       {status === 'pass' && (
                         <Badge variant="success" className="gap-1">
                           <CheckCircle className="h-3 w-3" />
                           Passed
                         </Badge>
                       )}
                       {status === 'fail' && (
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
           onClick={() => navigate('/franchise/schedule')}
         >
           Cancel
         </Button>
         <Button
           onClick={handleSubmit}
           disabled={isSubmitting}
           className="gap-2 shadow-glow"
         >
           <Save className="h-4 w-4" />
           {isSubmitting ? 'Submitting...' : 'Submit Results'}
         </Button>
       </div>
     </div>
   );
 }