import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getDisplayPrice } from "@/lib/currency";
import { useState, useEffect } from "react";
import { detectUserCurrency } from "@/lib/currency";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCart();
  const [currency, setCurrency] = useState<string>('INR');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
  }, []);

  const totalItems = getTotalItems();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold bg-primary animate-in zoom-in-50 duration-300"
              variant="default"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Shopping Basket</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {totalItems === 0 ? "Empty basket" : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
              </p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center max-w-sm">
                <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Your basket is empty</h3>
                <p className="text-sm text-muted-foreground">
                  Browse our store and add items to get started
                </p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-3 py-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="group relative flex gap-4 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/40 hover:border-primary/40 transition-all duration-300"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base mb-1 truncate">{item.name}</h4>
                        <p className="text-base text-primary font-bold">
                          {getDisplayPrice(item.price, currency)}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:border-primary/40"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="min-w-[3rem] text-center">
                            <span className="text-sm font-semibold px-3 py-1 bg-background/60 rounded-lg border border-border/40">
                              {item.quantity}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:border-primary/40"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t bg-background/95 backdrop-blur-sm px-6 pt-4 pb-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{getDisplayPrice(getTotalPrice(), currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary text-xl">{getDisplayPrice(getTotalPrice(), currency)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25" 
                    size="lg"
                    onClick={() => {
                      setOpen(false);
                      navigate('/checkout');
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                    onClick={clearCart}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
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
