 import React, { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Calendar } from '@/components/ui/calendar';
 import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { FileSpreadsheet, FileText, Package, CalendarIcon, Download } from 'lucide-react';
 import { format } from 'date-fns';
 import { cn } from '@/lib/utils';
 import { useToast } from '@/hooks/use-toast';
 import {
   jsonToCSV,
   downloadCSV,
   generatePrintablePDF,
   formatDateForExport,
 } from '@/lib/exportUtils';
 
 // Mock data for exports
 const mockLedgerData = [
   { invoiceId: 'INV-2024-001', date: '2024-01-15', type: 'FRANCHISE_FEE', amount: 10000, status: 'OVERDUE' },
   { invoiceId: 'INV-2024-002', date: '2024-01-20', type: 'KIT_PURCHASE', amount: 5000, status: 'PENDING' },
   { invoiceId: 'INV-2023-045', date: '2023-12-31', type: 'FRANCHISE_FEE', amount: 10000, status: 'PAID' },
   { invoiceId: 'INV-2023-042', date: '2023-12-25', type: 'KIT_PURCHASE', amount: 3500, status: 'PAID' },
 ];
 
 const mockAttendanceData = [
   { studentName: 'Aarav Patel', batch: 'Batch A', week1: 'P,P,A,P,P', week2: 'P,P,P,P,A', week3: 'P,P,P,P,P', week4: 'A,P,P,P,P' },
   { studentName: 'Diya Sharma', batch: 'Batch A', week1: 'P,P,P,P,P', week2: 'P,A,P,P,P', week3: 'P,P,P,A,P', week4: 'P,P,P,P,P' },
   { studentName: 'Vihaan Singh', batch: 'Batch A', week1: 'P,P,P,P,P', week2: 'P,P,P,P,P', week3: 'A,P,P,P,P', week4: 'P,P,P,P,P' },
 ];
 
 const mockInventoryData = [
   { sku: 'KIT-L1-001', name: 'Level 1 Abacus Kit', currentStock: 12, reorderLevel: 10, lastRestocked: '2024-01-10' },
   { sku: 'KIT-L2-001', name: 'Level 2 Abacus Kit', currentStock: 5, reorderLevel: 8, lastRestocked: '2024-01-05' },
   { sku: 'BOOK-L1-001', name: 'Level 1 Workbook', currentStock: 25, reorderLevel: 15, lastRestocked: '2024-01-12' },
   { sku: 'TOOL-ABACUS-STD', name: 'Standard Abacus', currentStock: 8, reorderLevel: 10, lastRestocked: '2023-12-20' },
 ];
 
 const batches = ['Batch A', 'Batch B', 'Batch C', 'Batch D'];
 const months = [
   'January', 'February', 'March', 'April', 'May', 'June',
   'July', 'August', 'September', 'October', 'November', 'December',
 ];
 
 export default function ReportsPage() {
   const { toast } = useToast();
   
   const [startDate, setStartDate] = useState<Date>();
   const [endDate, setEndDate] = useState<Date>();
   const [selectedBatch, setSelectedBatch] = useState<string>('');
   const [selectedMonth, setSelectedMonth] = useState<string>('');
 
   const handleLedgerExport = () => {
     if (!startDate || !endDate) {
       toast({
         title: 'Select Date Range',
         description: 'Please select both start and end dates.',
         variant: 'destructive',
       });
       return;
     }
 
     const columns = [
       { key: 'invoiceId' as const, label: 'Invoice ID' },
       { key: 'date' as const, label: 'Date' },
       { key: 'type' as const, label: 'Type' },
       { key: 'amount' as const, label: 'Amount (₹)' },
       { key: 'status' as const, label: 'Status' },
     ];
 
     const csv = jsonToCSV(mockLedgerData, columns);
     downloadCSV(csv, `financial-ledger-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}`);
 
     toast({
       title: 'Export Complete',
       description: 'Financial ledger CSV downloaded successfully.',
     });
   };
 
   const handleAttendanceExport = () => {
     if (!selectedBatch || !selectedMonth) {
       toast({
         title: 'Select Filters',
         description: 'Please select both batch and month.',
         variant: 'destructive',
       });
       return;
     }
 
     const tableContent = `
       <p><strong>Batch:</strong> ${selectedBatch} | <strong>Month:</strong> ${selectedMonth}</p>
       <table>
         <thead>
           <tr>
             <th>Student Name</th>
             <th>Week 1</th>
             <th>Week 2</th>
             <th>Week 3</th>
             <th>Week 4</th>
           </tr>
         </thead>
         <tbody>
           ${mockAttendanceData
             .map(
               (row) => `
             <tr>
               <td>${row.studentName}</td>
               <td>${row.week1}</td>
               <td>${row.week2}</td>
               <td>${row.week3}</td>
               <td>${row.week4}</td>
             </tr>
           `
             )
             .join('')}
         </tbody>
       </table>
       <p style="margin-top: 20px;"><strong>Legend:</strong> P = Present, A = Absent</p>
     `;
 
     generatePrintablePDF(
       `Attendance Report - ${selectedBatch} - ${selectedMonth}`,
       tableContent,
       `Generated on ${formatDateForExport(new Date())} | Skills Ville Abacus`
     );
 
     toast({
       title: 'PDF Generated',
       description: 'Attendance report opened in print dialog.',
     });
   };
 
   const handleInventoryExport = () => {
     const columns = [
       { key: 'sku' as const, label: 'SKU' },
       { key: 'name' as const, label: 'Product Name' },
       { key: 'currentStock' as const, label: 'Current Stock' },
       { key: 'reorderLevel' as const, label: 'Reorder Level' },
       { key: 'lastRestocked' as const, label: 'Last Restocked' },
     ];
 
     const csv = jsonToCSV(mockInventoryData, columns);
     downloadCSV(csv, `inventory-audit-${format(new Date(), 'yyyy-MM-dd')}`);
 
     toast({
       title: 'Export Complete',
       description: 'Inventory audit CSV downloaded successfully.',
     });
   };
 
   return (
     <div className="space-y-6 animate-fade-in">
       {/* Header */}
       <div>
         <h1 className="text-2xl font-bold flex items-center gap-2">
           <FileText className="h-6 w-6 text-primary" />
           Reports & Exports
         </h1>
         <p className="text-muted-foreground">
           Generate and download reports for your franchise operations
         </p>
       </div>
 
       {/* Report Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Financial Ledger Export */}
         <Card className="flex flex-col">
           <CardHeader>
             <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
               <FileSpreadsheet className="h-6 w-6 text-primary" />
             </div>
             <CardTitle>Financial Ledger</CardTitle>
             <CardDescription>
               Export payment history and invoice records
             </CardDescription>
           </CardHeader>
           <CardContent className="flex-1 flex flex-col gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Start Date</label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                       'w-full justify-start text-left font-normal',
                       !startDate && 'text-muted-foreground'
                     )}
                   >
                     <CalendarIcon className="mr-2 h-4 w-4" />
                     {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={startDate}
                     onSelect={setStartDate}
                     initialFocus
                     className="p-3 pointer-events-auto"
                   />
                 </PopoverContent>
               </Popover>
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">End Date</label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                       'w-full justify-start text-left font-normal',
                       !endDate && 'text-muted-foreground'
                     )}
                   >
                     <CalendarIcon className="mr-2 h-4 w-4" />
                     {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={endDate}
                     onSelect={setEndDate}
                     initialFocus
                     className="p-3 pointer-events-auto"
                   />
                 </PopoverContent>
               </Popover>
             </div>
             <Button onClick={handleLedgerExport} className="mt-auto gap-2">
               <Download className="h-4 w-4" />
               Download CSV
             </Button>
           </CardContent>
         </Card>
 
         {/* Attendance Sheet Export */}
         <Card className="flex flex-col">
           <CardHeader>
             <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-2">
               <CalendarIcon className="h-6 w-6 text-success" />
             </div>
             <CardTitle>Attendance Sheet</CardTitle>
             <CardDescription>
               Generate printable attendance reports by batch
             </CardDescription>
           </CardHeader>
           <CardContent className="flex-1 flex flex-col gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Select Batch</label>
               <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                 <SelectTrigger>
                   <SelectValue placeholder="Choose batch" />
                 </SelectTrigger>
                 <SelectContent>
                   {batches.map((batch) => (
                     <SelectItem key={batch} value={batch}>
                       {batch}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Select Month</label>
               <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                 <SelectTrigger>
                   <SelectValue placeholder="Choose month" />
                 </SelectTrigger>
                 <SelectContent>
                   {months.map((month) => (
                     <SelectItem key={month} value={month}>
                       {month}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <Button onClick={handleAttendanceExport} className="mt-auto gap-2" variant="outline">
               <FileText className="h-4 w-4" />
               Download PDF
             </Button>
           </CardContent>
         </Card>
 
         {/* Inventory Audit Export */}
         <Card className="flex flex-col">
           <CardHeader>
             <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
               <Package className="h-6 w-6 text-warning" />
             </div>
             <CardTitle>Inventory Audit</CardTitle>
             <CardDescription>
               Export current stock levels and reorder status
             </CardDescription>
           </CardHeader>
           <CardContent className="flex-1 flex flex-col gap-4">
             <div className="flex-1 flex items-center justify-center text-center p-4 border border-dashed rounded-lg bg-muted/30">
               <p className="text-sm text-muted-foreground">
                 This export includes all products with current stock levels, reorder thresholds, and last restock dates.
               </p>
             </div>
             <Button onClick={handleInventoryExport} className="mt-auto gap-2" variant="outline">
               <Download className="h-4 w-4" />
               Download CSV
             </Button>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }