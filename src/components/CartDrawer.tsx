import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getDisplayPrice } from "@/lib/currency";
import { useState, useEffect } from "react";
import { detectUserCurrency } from "@/lib/currency";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart();
  const [currency, setCurrency] = useState<string>('INR');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
  }, []);

  const totalItems = getTotalItems();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="default"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Basket</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full mt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your basket is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-primary font-semibold mt-1">
                        {getDisplayPrice(item.price, currency)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{getDisplayPrice(getTotalPrice(), currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{getDisplayPrice(getTotalPrice(), currency)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={clearCart}
                  >
                    Clear Basket
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
