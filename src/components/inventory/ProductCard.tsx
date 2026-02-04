import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  type: 'book' | 'tshirt' | 'kit' | 'general';
}

interface ProductCardProps {
  product: Product;
  onRestock: (productId: string) => void;
}

const levelOptions = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8'];
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];

export function ProductCard({ product, onRestock }: ProductCardProps) {
  const isLowStock = product.stock < 10;

  return (
    <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
        <div className="h-40 bg-muted rounded-t-lg flex items-center justify-center relative">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-t-lg" />
          ) : (
            <Package className="h-16 w-16 text-muted-foreground/40" />
          )}
          {isLowStock && (
            <Badge variant="destructive" className="absolute top-2 right-2 font-semibold">
              LOW STOCK
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground">{product.name}</h3>
          <p className="text-xl font-bold text-primary">₹{product.price.toLocaleString()}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-sm font-medium",
            isLowStock ? "text-destructive" : "text-muted-foreground"
          )}>
            Stock: {product.stock} units
          </span>
        </div>

        {/* Variant Selectors */}
        {product.type === 'book' && (
          <Select defaultValue="Level 1">
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {levelOptions.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {product.type === 'tshirt' && (
          <Select defaultValue="M">
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select Size" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {sizeOptions.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => onRestock(product.id)} 
          variant="outline" 
          className="w-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Restock
        </Button>
      </CardFooter>
    </Card>
  );
}
