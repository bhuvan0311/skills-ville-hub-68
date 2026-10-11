import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { safeCheckoutUrl } from "@/lib/erp/rules";
interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    type: string;
    amount: number;
    dueDate: string;
    paymentLink?: string;
  } | null;
  onPaymentComplete?: (invoiceId: string) => void;
}
export function PaymentModal({
  open,
  onOpenChange,
  invoice,
}: PaymentModalProps) {
  if (!invoice) return null;
  const link = safeCheckoutUrl(invoice.paymentLink);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invoice {invoice.id}</DialogTitle>
          <DialogDescription>
            Payment status changes only after verified settlement.
          </DialogDescription>
        </DialogHeader>
        <p className="text-2xl font-semibold">
          ₹{invoice.amount.toLocaleString("en-IN")}
        </p>
        <p>Due: {invoice.dueDate}</p>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Open configured payment page
          </a>
        ) : (
          <p className="text-muted-foreground">
            Contact Head Office for payment instructions. No checkout is
            configured for this invoice.
          </p>
        )}
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
