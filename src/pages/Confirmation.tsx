import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getDisplayPrice } from "@/lib/currency";
import { CheckCircle2, Download, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const orderDetails = location.state?.orderDetails;

  useEffect(() => {
    if (!orderDetails) {
      navigate('/store');
      return;
    }

    // Send confirmation email
    const sendConfirmationEmail = async () => {
      try {
        const { error } = await supabase.functions.invoke('send-purchase-confirmation', {
          body: {
            customerEmail: orderDetails.customerInfo.email,
            customerName: orderDetails.customerInfo.name,
            orderNumber: orderDetails.orderNumber,
            items: orderDetails.items,
            total: orderDetails.total,
            currency: orderDetails.currency,
          }
        });

        if (error) {
          console.error('Error sending confirmation email:', error);
          toast({
            title: "Email notification",
            description: "There was an issue sending your confirmation email, but your order was successful.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Error invoking email function:', error);
      }
    };

    sendConfirmationEmail();
  }, [orderDetails, navigate, toast]);

  if (!orderDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been successfully processed.
            </p>
          </div>

          <Card className="glass-effect mb-6">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Order Number</p>
                  <p className="font-mono font-semibold">{orderDetails.orderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Date</p>
                  <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground mb-2 text-sm">Customer Information</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Name:</span> {orderDetails.customerInfo.name}</p>
                  <p><span className="font-semibold">Email:</span> {orderDetails.customerInfo.email}</p>
                  <p><span className="font-semibold">Discord:</span> {orderDetails.customerInfo.discord}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground mb-3 text-sm">Items Purchased</p>
                <div className="space-y-3">
                  {orderDetails.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">
                        {getDisplayPrice(item.price * item.quantity, orderDetails.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Paid</span>
                <span className="text-primary">
                  {getDisplayPrice(orderDetails.total, orderDetails.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20 mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-semibold">What's Next?</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>A confirmation email has been sent to {orderDetails.customerInfo.email}</li>
                  <li>Our team will process your order within 24-48 hours</li>
                  <li>You will be contacted on Discord ({orderDetails.customerInfo.discord})</li>
                  <li>Please keep your order number for reference</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button onClick={() => navigate('/store')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Confirmation;
