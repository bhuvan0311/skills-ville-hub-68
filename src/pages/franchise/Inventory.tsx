import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard, Product } from '@/components/inventory/ProductCard';
import { OrderStepper, OrderStatus } from '@/components/inventory/OrderStepper';
import { useToast } from '@/hooks/use-toast';
import { Package, Sparkles, ShoppingCart, TrendingUp } from 'lucide-react';

const mockProducts: Product[] = [
  { id: 'P001', name: 'Level Books', price: 350, stock: 5, type: 'book' },
  { id: 'P002', name: 'Abacus Kit', price: 1200, stock: 12, type: 'kit' },
  { id: 'P003', name: 'Skills Ville T-Shirt', price: 450, stock: 8, type: 'tshirt' },
  { id: 'P004', name: 'Practice Workbook', price: 180, stock: 25, type: 'book' },
  { id: 'P005', name: 'Student Bag', price: 800, stock: 3, type: 'general' },
  { id: 'P006', name: 'Flash Cards Set', price: 250, stock: 18, type: 'general' },
];

interface RecentOrder {
  id: string;
  status: OrderStatus;
  items: string;
  date: string;
}

const recentOrders: RecentOrder[] = [
  { id: '408', status: 'in_transit', items: '10 Abacus Kits', date: 'Feb 2, 2024' },
  { id: '407', status: 'delivered', items: '20 Level Books', date: 'Jan 28, 2024' },
  { id: '406', status: 'dispatched', items: '5 T-Shirts (M)', date: 'Feb 1, 2024' },
];

export default function InventoryPage() {
  const { toast } = useToast();
  const [products] = useState<Product[]>(mockProducts);

  const handleRestock = (productId: string) => {
    const product = products.find(p => p.id === productId);
    toast({
      title: 'Restock Requested',
      description: `Restock request for ${product?.name} has been submitted.`,
    });
  };

  const handleApproveOrder = () => {
    toast({
      title: 'Order Approved',
      description: 'Smart restock order for 10 Level 1 Kits has been placed.',
    });
  };

  const lowStockCount = products.filter(p => p.stock < 10).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory & Store
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage stock levels and place restock orders
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="gap-1">
            {lowStockCount} Low Stock
          </Badge>
          <Badge variant="secondary" className="gap-1">
            {products.length} Products
          </Badge>
        </div>
      </div>

      {/* Main Content: 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Grid - Left Column */}
        <div className="lg:col-span-2">
          <Card className="bg-card border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Product Catalog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onRestock={handleRestock}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Smart Restock Recommendation */}
          <Card className="bg-card border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-warning" />
                Smart Restock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      System Recommendation
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Order <strong>10 Level 1 Kits</strong> (based on recent enrollments).
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleApproveOrder} className="w-full">
                Approve Order
              </Button>
            </CardContent>
          </Card>

          {/* Order Tracker */}
          <Card className="bg-card border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentOrders.map((order) => (
                <OrderStepper
                  key={order.id}
                  orderId={order.id}
                  currentStatus={order.status}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
