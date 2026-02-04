import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Building2, CheckCircle2, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    type: string;
    amount: number;
    dueDate: string;
  } | null;
  onPaymentComplete: (invoiceId: string) => void;
}

export function PaymentModal({ open, onOpenChange, invoice, onPaymentComplete }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsComplete(true);
    
    // Auto close after showing success
    setTimeout(() => {
      if (invoice) {
        onPaymentComplete(invoice.id);
      }
      setIsComplete(false);
      onOpenChange(false);
    }, 1500);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-card">
        {isComplete ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                Payment Successful!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Invoice {invoice.id} has been paid
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Pay Invoice
              </DialogTitle>
              <DialogDescription>
                Complete payment for this invoice
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Invoice Details Card */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Invoice ID</span>
                  <span className="font-mono font-medium">{invoice.id}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="secondary">
                    {invoice.type === 'FRANCHISE_FEE' ? 'Franchise Fee' : 'Kit Purchase'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="font-medium">{invoice.dueDate}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-xl font-bold text-primary">
                    ₹{invoice.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Methods (Mock) */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Card/UPI</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs">Net Banking</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  (Payment gateway will be connected in next phase)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing} className="gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{invoice.amount.toLocaleString('en-IN')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
