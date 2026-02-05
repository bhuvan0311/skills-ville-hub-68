 import React, { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Award, FileText, Truck, Clock, CheckCircle } from 'lucide-react';
 import { useToast } from '@/hooks/use-toast';
 
 // Mock certificate data
 const mockCertificates = [
   {
     id: '1',
     studentName: 'Aarav Patel',
     franchiseName: 'Jayanagar Center',
     level: 1,
     examDate: '2024-01-15',
     status: 'PENDING',
   },
   {
     id: '2',
     studentName: 'Diya Sharma',
     franchiseName: 'Jayanagar Center',
     level: 1,
     examDate: '2024-01-15',
     status: 'PENDING',
   },
   {
     id: '3',
     studentName: 'Priya Patel',
     franchiseName: 'Koramangala Center',
     level: 2,
     examDate: '2024-01-10',
     status: 'GENERATED',
   },
   {
     id: '4',
     studentName: 'Arjun Kumar',
     franchiseName: 'Indiranagar Center',
     level: 3,
     examDate: '2024-01-08',
     status: 'GENERATED',
   },
   {
     id: '5',
     studentName: 'Ananya Reddy',
     franchiseName: 'HSR Layout Center',
     level: 2,
     examDate: '2023-12-20',
     status: 'SHIPPED',
   },
   {
     id: '6',
     studentName: 'Vihaan Singh',
     franchiseName: 'Whitefield Center',
     level: 1,
     examDate: '2023-12-15',
     status: 'SHIPPED',
   },
 ];
 
 type CertificateStatus = 'PENDING' | 'GENERATED' | 'SHIPPED';
 
 export default function CertificatesPage() {
   const { toast } = useToast();
   const [certificates, setCertificates] = useState(mockCertificates);
 
   const pendingCerts = certificates.filter((c) => c.status === 'PENDING');
   const generatedCerts = certificates.filter((c) => c.status === 'GENERATED');
   const shippedCerts = certificates.filter((c) => c.status === 'SHIPPED');
 
   const handleGeneratePDF = (certId: string, studentName: string) => {
     setCertificates((prev) =>
       prev.map((c) =>
         c.id === certId ? { ...c, status: 'GENERATED' as CertificateStatus } : c
       )
     );
 
     toast({
       title: 'Certificate Generated',
       description: `Certificate for ${studentName} is ready for printing.`,
     });
   };
 
   const handleMarkShipped = (certId: string, studentName: string) => {
     setCertificates((prev) =>
       prev.map((c) =>
         c.id === certId ? { ...c, status: 'SHIPPED' as CertificateStatus } : c
       )
     );
 
     toast({
       title: 'Certificate Shipped',
       description: `Certificate for ${studentName} marked as shipped.`,
     });
   };
 
   const getStatusBadge = (status: CertificateStatus) => {
     switch (status) {
       case 'PENDING':
         return (
           <Badge variant="warning" className="gap-1">
             <Clock className="h-3 w-3" />
             Pending
           </Badge>
         );
       case 'GENERATED':
         return (
           <Badge variant="secondary" className="gap-1">
             <FileText className="h-3 w-3" />
             Ready to Ship
           </Badge>
         );
       case 'SHIPPED':
         return (
           <Badge variant="success" className="gap-1">
             <CheckCircle className="h-3 w-3" />
             Shipped
           </Badge>
         );
     }
   };
 
   const renderTable = (certs: typeof mockCertificates, showActions: boolean) => (
     <Table>
       <TableHeader>
         <TableRow>
           <TableHead>Student Name</TableHead>
           <TableHead>Franchise</TableHead>
           <TableHead>Level Passed</TableHead>
           <TableHead>Exam Date</TableHead>
           <TableHead>Status</TableHead>
           {showActions && <TableHead className="text-right">Actions</TableHead>}
         </TableRow>
       </TableHeader>
       <TableBody>
         {certs.length === 0 ? (
           <TableRow>
             <TableCell colSpan={showActions ? 6 : 5} className="text-center text-muted-foreground py-8">
               No certificates in this category
             </TableCell>
           </TableRow>
         ) : (
           certs.map((cert) => (
             <TableRow key={cert.id}>
               <TableCell className="font-medium">{cert.studentName}</TableCell>
               <TableCell>{cert.franchiseName}</TableCell>
               <TableCell>
                 <Badge variant="outline">Level {cert.level}</Badge>
               </TableCell>
               <TableCell>{new Date(cert.examDate).toLocaleDateString('en-IN')}</TableCell>
               <TableCell>{getStatusBadge(cert.status as CertificateStatus)}</TableCell>
               {showActions && (
                 <TableCell className="text-right">
                   {cert.status === 'PENDING' && (
                     <Button
                       size="sm"
                       onClick={() => handleGeneratePDF(cert.id, cert.studentName)}
                       className="gap-1"
                     >
                       <FileText className="h-4 w-4" />
                       Generate PDF
                     </Button>
                   )}
                   {cert.status === 'GENERATED' && (
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => handleMarkShipped(cert.id, cert.studentName)}
                       className="gap-1"
                     >
                       <Truck className="h-4 w-4" />
                       Mark as Shipped
                     </Button>
                   )}
                 </TableCell>
               )}
             </TableRow>
           ))
         )}
       </TableBody>
     </Table>
   );
 
   return (
     <div className="space-y-6 animate-fade-in">
       {/* Header */}
       <div>
         <h1 className="text-2xl font-bold flex items-center gap-2">
           <Award className="h-6 w-6 text-primary" />
           Certificate Hub
         </h1>
         <p className="text-muted-foreground">
           Manage and dispatch student certificates across all franchises
         </p>
       </div>
 
       {/* Summary Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                 <Clock className="h-6 w-6 text-warning" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Pending Generation</p>
                 <p className="text-2xl font-bold">{pendingCerts.length}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                 <FileText className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Ready to Ship</p>
                 <p className="text-2xl font-bold">{generatedCerts.length}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                 <Truck className="h-6 w-6 text-success" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Shipped</p>
                 <p className="text-2xl font-bold">{shippedCerts.length}</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Tabs */}
       <Tabs defaultValue="pending" className="space-y-4">
         <TabsList>
           <TabsTrigger value="pending" className="gap-2">
             <Clock className="h-4 w-4" />
             Pending Generation
             {pendingCerts.length > 0 && (
               <Badge variant="warning" className="ml-1">{pendingCerts.length}</Badge>
             )}
           </TabsTrigger>
           <TabsTrigger value="ready" className="gap-2">
             <FileText className="h-4 w-4" />
             Ready to Ship
             {generatedCerts.length > 0 && (
               <Badge variant="secondary" className="ml-1">{generatedCerts.length}</Badge>
             )}
           </TabsTrigger>
           <TabsTrigger value="shipped" className="gap-2">
             <Truck className="h-4 w-4" />
             Shipped
           </TabsTrigger>
         </TabsList>
 
         <Card>
           <TabsContent value="pending" className="m-0">
             <CardContent className="pt-6">
               {renderTable(pendingCerts, true)}
             </CardContent>
           </TabsContent>
           <TabsContent value="ready" className="m-0">
             <CardContent className="pt-6">
               {renderTable(generatedCerts, true)}
             </CardContent>
           </TabsContent>
           <TabsContent value="shipped" className="m-0">
             <CardContent className="pt-6">
               {renderTable(shippedCerts, false)}
             </CardContent>
           </TabsContent>
         </Card>
       </Tabs>
     </div>
   );
 }