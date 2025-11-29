import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { getDisplayPrice, detectUserCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, CreditCard, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import gtaBg from "@/assets/hero-home-realistic.jpg";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [currency, setCurrency] = useState<string>('INR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    discord: '',
    promoCode: '',
  });
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
    
    if (items.length === 0) {
      navigate('/store');
    }
  }, [items, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear promo error when user types
    if (name === 'promoCode') {
      setPromoError('');
      setPromoDiscount(0);
    }
  };

  const validatePromoCode = async () => {
    if (!formData.promoCode.trim()) {
      setPromoError('');
      setPromoDiscount(0);
      return;
    }

    try {
      const { data: promoData, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', formData.promoCode.toUpperCase())
        .eq('is_used', false)
        .single();

      if (error || !promoData) {
        setPromoError('Invalid or already used promo code');
        setPromoDiscount(0);
        return;
      }

      // Check if expired
      if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
        setPromoError('This promo code has expired');
        setPromoDiscount(0);
        return;
      }

      setPromoDiscount(promoData.discount_percentage);
      setPromoError('');
      toast({
        title: "Promo Code Applied!",
        description: `You got ${promoData.discount_percentage}% off your purchase!`,
      });
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError('Error validating promo code');
      setPromoDiscount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.discord) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please login to complete your purchase",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Mark promo code as used if provided
      if (formData.promoCode && promoDiscount > 0) {
        await supabase
          .from('promo_codes')
          .update({
            is_used: true,
            used_by: session.user.id,
            used_at: new Date().toISOString(),
          })
          .eq('code', formData.promoCode.toUpperCase());
      }

      const finalTotal = promoDiscount > 0 
        ? getTotalPrice() * (1 - promoDiscount / 100)
        : getTotalPrice();
      
      // Generate order number
      const orderNumber = `SLRP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Prepare order data
      const orderData = {
        user_id: session.user.id,
        order_number: orderNumber,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          icon: item.icon,
        })),
        total: finalTotal,
        currency: currency,
        status: 'pending',
        customer_name: formData.name,
        customer_email: formData.email,
        discord_username: formData.discord,
      };

      // Save order to database
      const { error: orderError } = await supabase
        .from('orders')
        .insert(orderData);

      if (orderError) throw orderError;

      // Send email notification
      try {
        await supabase.functions.invoke('send-purchase-confirmation', {
          body: {
            customerEmail: formData.email,
            customerName: formData.name,
            orderNumber: orderNumber,
            items: items.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            total: finalTotal,
            currency: currency,
          },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Don't fail the order if email fails
      }

      toast({
        title: "Order Placed Successfully! 🎉",
        description: "Check your email for confirmation. You will be contacted on Discord.",
      });
      
      clearCart();
      navigate("/order-history");
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* GTA 5 Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(${gtaBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95" />
      
      {/* Content */}
      <div className="relative z-10">
        <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">Checkout</h1>
            <p className="text-lg text-muted-foreground font-medium">Complete your purchase securely</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-effect border-2 border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Lock className="h-6 w-6 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="discord">Discord Username *</Label>
                      <Input
                        id="discord"
                        name="discord"
                        value={formData.discord}
                        onChange={handleInputChange}
                        placeholder="username#0000"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="promoCode"
                          name="promoCode"
                          value={formData.promoCode}
                          onChange={handleInputChange}
                          placeholder="Enter promo code"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={validatePromoCode}
                          disabled={!formData.promoCode.trim()}
                        >
                          Apply
                        </Button>
                      </div>
                      {promoError && (
                        <p className="text-sm text-destructive mt-1">{promoError}</p>
                      )}
                      {promoDiscount > 0 && (
                        <p className="text-sm text-primary font-medium mt-1">
                          ✓ {promoDiscount}% discount applied!
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/85 hover:to-primary/70 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      size="lg"
                      disabled={isProcessing}
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      {isProcessing ? 'Processing...' : 'Complete Purchase'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="glass-effect border-2 border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl sticky top-24">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                      <ShoppingCart className="w-5 h-5 text-primary-foreground" />
                    </div>
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/20">
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
                            <Sparkles className="h-8 w-8 text-primary/40 hidden" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-base mb-1">{item.name}</p>
                          <p className="text-sm text-muted-foreground mb-1">Quantity: {item.quantity}</p>
                          <p className="font-bold text-primary">
                            {getDisplayPrice(item.price * item.quantity, currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40">
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground font-medium">Subtotal</span>
                      <span className="font-bold">
                        {getDisplayPrice(getTotalPrice(), currency)}
                      </span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-base text-primary font-bold">
                        <span>Promo Discount ({promoDiscount}%)</span>
                        <span>-{getDisplayPrice(getTotalPrice() * (promoDiscount / 100), currency)}</span>
                      </div>
                    )}
                    <Separator className="bg-border/50" />
                    <div className="flex justify-between text-xl font-bold">
                      <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Total</span>
                      <span className="text-primary text-2xl">
                        {getDisplayPrice(
                          promoDiscount > 0 
                            ? getTotalPrice() * (1 - promoDiscount / 100)
                            : getTotalPrice(), 
                          currency
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-4 mt-4 border border-border/40">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      By completing this purchase, you agree to our terms and conditions.
                      You will receive a confirmation email with your order details.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Checkout;
