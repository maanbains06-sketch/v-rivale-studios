import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus, Package, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getDisplayPrice } from "@/lib/currency";
import { useState, useEffect } from "react";
import { detectUserCurrency } from "@/lib/currency";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import gtaBg from "@/assets/hero-home-gta-thunder.jpg";

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
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        {/* GTA 5 Background */}
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${gtaBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95" />
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Shopping Basket</SheetTitle>
              <p className="text-sm text-muted-foreground font-medium">
                {totalItems === 0 ? "Empty basket" : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
              </p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
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
                <div className="space-y-4 py-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="group relative flex gap-4 p-4 bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl border-2 border-border/60 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
                    >
                      {/* Item Image */}
                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                          <img 
                            src={item.icon} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Sparkles className="h-10 w-10 text-primary/40 hidden" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg mb-1 truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{item.name}</h4>
                        <p className="text-lg text-primary font-bold mb-3">
                          {getDisplayPrice(item.price, currency)}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="min-w-[3.5rem] text-center">
                            <span className="text-base font-bold px-4 py-1.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
                              {item.quantity}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
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
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl hover:scale-105 transition-all duration-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t-2 bg-gradient-to-br from-background/98 via-background/95 to-primary/5 backdrop-blur-md px-6 pt-5 pb-6 space-y-4">
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40">
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="font-bold">{getDisplayPrice(getTotalPrice(), currency)}</span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex justify-between text-xl font-bold">
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Total</span>
                    <span className="text-primary text-2xl">{getDisplayPrice(getTotalPrice(), currency)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/85 hover:to-primary/70 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" 
                    size="lg"
                    onClick={() => {
                      setOpen(false);
                      navigate('/checkout');
                    }}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Proceed to Checkout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 border-2 font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
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
