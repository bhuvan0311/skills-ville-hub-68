import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentModal } from '@/components/payments/PaymentModal';
import { 
  IndianRupee, 
  FileText, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  ExternalLink,
  Filter
} from 'lucide-react';

type InvoiceStatus = 'OVERDUE' | 'PENDING' | 'PAID';
type InvoiceType = 'FRANCHISE_FEE' | 'KIT_PURCHASE';

interface LedgerEntry {
  id: string;
  invoiceId: string;
  date: string;
  type: InvoiceType;
  description: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
}

// Mock ledger data
const mockLedgerData: LedgerEntry[] = [
  {
    id: '1',
    invoiceId: 'INV-2024-001',
    date: '2024-01-15',
    type: 'FRANCHISE_FEE',
    description: 'January Franchise Fee',
    amount: 10000,
    status: 'OVERDUE',
    dueDate: 'Jan 31, 2024',
  },
  {
    id: '2',
    invoiceId: 'INV-2024-002',
    date: '2024-01-20',
    type: 'KIT_PURCHASE',
    description: 'Kit Order #405',
    amount: 5000,
    status: 'PENDING',
    dueDate: 'Feb 10, 2024',
  },
  {
    id: '3',
    invoiceId: 'INV-2023-045',
    date: '2023-12-15',
    type: 'FRANCHISE_FEE',
    description: 'December Franchise Fee',
    amount: 10000,
    status: 'PAID',
    dueDate: 'Dec 31, 2023',
  },
  {
    id: '4',
    invoiceId: 'INV-2023-042',
    date: '2023-12-10',
    type: 'KIT_PURCHASE',
    description: 'Kit Order #398',
    amount: 3500,
    status: 'PAID',
    dueDate: 'Dec 25, 2023',
  },
  {
    id: '5',
    invoiceId: 'INV-2023-040',
    date: '2023-11-15',
    type: 'FRANCHISE_FEE',
    description: 'November Franchise Fee',
    amount: 10000,
    status: 'PAID',
    dueDate: 'Nov 30, 2023',
  },
];

const statusConfig: Record<InvoiceStatus, { badge: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  OVERDUE: {
    badge: 'OVERDUE',
    class: 'bg-destructive/10 text-destructive border-destructive/30',
    icon: AlertCircle,
  },
  PENDING: {
    badge: 'PENDING',
    class: 'bg-warning/10 text-warning border-warning/30',
    icon: Clock,
  },
  PAID: {
    badge: 'PAID',
    class: 'bg-success/10 text-success border-success/30',
    icon: CheckCircle2,
  },
};

export default function PaymentsPage() {
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>(mockLedgerData);
  const [activeFilter, setActiveFilter] = useState<'all' | 'FRANCHISE_FEE' | 'KIT_PURCHASE'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<LedgerEntry | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Calculate totals
  const totalOutstanding = ledgerData
    .filter((entry) => entry.status !== 'PAID')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const overdueCount = ledgerData.filter((entry) => entry.status === 'OVERDUE').length;
  const pendingCount = ledgerData.filter((entry) => entry.status === 'PENDING').length;

  // Filter data based on active filter
  const filteredData = ledgerData.filter((entry) => {
    if (activeFilter === 'all') return true;
    return entry.type === activeFilter;
  });

  const handlePayNow = (entry: LedgerEntry) => {
    setSelectedInvoice(entry);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = (invoiceId: string) => {
    setLedgerData((prev) =>
      prev.map((entry) =>
        entry.invoiceId === invoiceId ? { ...entry, status: 'PAID' as InvoiceStatus } : entry
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pending Payments</h1>
        <p className="text-muted-foreground">Manage your franchise invoices and dues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-card border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <IndianRupee className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Outstanding Dues</p>
              <p className="text-2xl font-bold text-destructive">
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Invoices</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue Invoices</p>
              <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="bg-white dark:bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Ledger
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Show All</TabsTrigger>
              <TabsTrigger value="FRANCHISE_FEE">Franchise Fee</TabsTrigger>
              <TabsTrigger value="KIT_PURCHASE">Kit Fee</TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="mt-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((entry) => {
                      const config = statusConfig[entry.status];
                      const StatusIcon = config.icon;
                      
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {new Date(entry.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.invoiceId}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {entry.type === 'FRANCHISE_FEE' ? 'Franchise Fee' : 'Material Cost'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{entry.amount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${config.class}`}>
                              <StatusIcon className="h-3 w-3" />
                              {config.badge}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.status !== 'PAID' ? (
                              <Button
                                size="sm"
                                onClick={() => handlePayNow(entry)}
                                className="shadow-glow"
                              >
                                Pay Now
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-muted-foreground"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Receipt
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoice={
          selectedInvoice
            ? {
                id: selectedInvoice.invoiceId,
                type: selectedInvoice.type,
                amount: selectedInvoice.amount,
                dueDate: selectedInvoice.dueDate,
              }
            : null
        }
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}
