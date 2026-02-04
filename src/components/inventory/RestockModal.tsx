import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShoppingCart, Minus, Plus } from 'lucide-react';

interface RestockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  } | null;
  onConfirm: (productId: string, quantity: number) => Promise<void>;
}

export function RestockModal({ open, onOpenChange, product, onConfirm }: RestockModalProps) {
  const [quantity, setQuantity] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!product || quantity <= 0) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(product.id, quantity);
      onOpenChange(false);
      setQuantity(10);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = product ? product.price * quantity : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Restock Order
          </DialogTitle>
          <DialogDescription>
            Place a restocking order for {product?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{product?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Current Stock: {product?.quantity} units
                </p>
              </div>
              <p className="text-lg font-bold text-primary">
                ₹{product?.price.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quantity to Order</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 5))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center text-lg font-semibold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 5)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-xl font-bold text-primary">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This will be added to your pending payments
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || quantity <= 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              'Place Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
