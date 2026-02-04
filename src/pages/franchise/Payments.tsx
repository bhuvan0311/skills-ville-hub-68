import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, FileText, AlertTriangle, CreditCard } from 'lucide-react';

interface PaymentRecord {
  id: string;
  date: string;
  invoiceId: string;
  category: 'Franchise Fee' | 'Material Cost';
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

const mockPayments: PaymentRecord[] = [
  {
    id: '1',
    date: '2024-01-15',
    invoiceId: 'INV-2024-001',
    category: 'Franchise Fee',
    description: 'Jan Franchise Fee',
    amount: 10000,
    status: 'overdue',
  },
  {
    id: '2',
    date: '2024-01-20',
    invoiceId: 'INV-2024-002',
    category: 'Material Cost',
    description: 'Kit Order #405',
    amount: 5000,
    status: 'pending',
  },
  {
    id: '3',
    date: '2023-12-15',
    invoiceId: 'INV-2023-012',
    category: 'Franchise Fee',
    description: 'Dec Franchise Fee',
    amount: 10000,
    status: 'paid',
  },
];

export default function PaymentsPage() {
  const { toast } = useToast();

  const totalOutstanding = mockPayments
    .filter((p) => p.status !== 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueCount = mockPayments.filter((p) => p.status === 'overdue').length;
  const pendingCount = mockPayments.filter((p) => p.status === 'pending').length;

  const handlePayNow = (invoiceId: string) => {
    toast({
      title: 'Payment Initiated',
      description: `Redirecting to payment gateway for ${invoiceId}...`,
    });
  };

  const handleViewReceipt = (invoiceId: string) => {
    toast({
      title: 'Opening Receipt',
      description: `Downloading receipt for ${invoiceId}...`,
    });
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge variant="destructive" className="font-semibold">
            OVERDUE
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 font-semibold">
            PENDING
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 font-semibold">
            PAID
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Pending Payments
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage your pending dues and payment history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-destructive">
                  ₹{totalOutstanding.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Invoices</p>
                <p className="text-2xl font-bold text-warning">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Invoices</p>
                <p className="text-2xl font-bold text-primary">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="bg-card border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payment Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Invoice ID</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm">
                      {formatDate(payment.date)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.invoiceId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {payment.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {payment.description}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      {payment.status === 'paid' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReceipt(payment.invoiceId)}
                        >
                          View Receipt
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePayNow(payment.invoiceId)}
                        >
                          Pay Now
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Note */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            💡 Payments are processed securely via Razorpay. For any queries, contact{' '}
            <span className="text-primary font-medium">accounts@skillsville.in</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
