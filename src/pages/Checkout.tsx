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
import { ShoppingCart, CreditCard } from "lucide-react";

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
  });

  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
    
    if (items.length === 0) {
      navigate('/store');
    }
  }, [items, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
      // Here you would integrate with your payment provider
      // For now, we'll simulate a successful payment
      
      // Navigate to confirmation page with order details
      navigate('/confirmation', {
        state: {
          orderDetails: {
            items: items,
            total: getTotalPrice(),
            currency: currency,
            customerInfo: formData,
            orderNumber: `SLRP-${Date.now()}`,
          }
        }
      });

      clearCart();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your purchase</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
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

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isProcessing}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Complete Purchase'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="glass-effect sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">
                          {getDisplayPrice(item.price * item.quantity, currency)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">
                        {getDisplayPrice(getTotalPrice(), currency)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        {getDisplayPrice(getTotalPrice(), currency)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 mt-4">
                    <p className="text-xs text-muted-foreground">
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
  );
};

export default Checkout;
