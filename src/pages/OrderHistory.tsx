import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Clock, CheckCircle, XCircle, ShoppingBag, Download } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { generateReceiptPDF } from "@/lib/pdfGenerator";
import gtaBg from "@/assets/hero-home-realistic.jpg";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  icon: string;
}

interface Order {
  id: string;
  order_number: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view your order history",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Order interface
      const transformedOrders = (data || []).map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[]
      }));
      
      setOrders(transformedOrders);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const handleDownloadReceipt = (order: Order) => {
    generateReceiptPDF({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      items: order.items,
      subtotal: order.total,
      total: order.total,
      currency: order.currency,
      date: order.created_at,
    });
    
    toast({
      title: "Receipt Downloaded",
      description: "Your purchase receipt has been downloaded successfully.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-3">
                Order History
              </h1>
              <p className="text-muted-foreground text-lg">
                Track and manage your purchases
              </p>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-lg mb-4">No orders yet</p>
                  <Button onClick={() => navigate("/store")} className="gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Browse Store
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="flex items-center gap-3">
                            {getStatusIcon(order.status)}
                            <span className="font-mono text-lg">#{order.order_number}</span>
                          </CardTitle>
                          <CardDescription>
                            {new Date(order.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </CardDescription>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Order Items */}
                      <div className="space-y-3 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <img 
                                  src={item.icon} 
                                  alt={item.name}
                                  className="h-8 w-8 object-contain"
                                />
                              </div>
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold">
                              {formatPrice(item.price * item.quantity, order.currency)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <p className="text-lg font-semibold">Total Amount</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatPrice(order.total, order.currency)}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDownloadReceipt(order)}
                          variant="outline"
                          className="gap-2 hover:bg-primary/10 hover:border-primary/50"
                        >
                          <Download className="h-4 w-4" />
                          Download Receipt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderHistory;