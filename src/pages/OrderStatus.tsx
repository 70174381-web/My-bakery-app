import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, Clock, CheckCircle, XCircle, ArrowLeft, Truck } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product_id: string;
  products?: { name: string; image_url: string | null } | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  payment_method: string | null;
  payment_confirmed: boolean;
  delivery_address: string | null;
  requested_delivery_date: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
  delivered: { label: "Delivered", color: "bg-blue-100 text-blue-800 border-blue-300", icon: Package },
};

const OrderStatus = () => {
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLatestOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const items = (data.order_items as any[]).map((item: any) => ({
          ...item,
          products: Array.isArray(item.products) ? item.products[0] : item.products,
        }));
        setOrder({ ...data, order_items: items } as Order);
      }
      setLoading(false);
    };

    fetchLatestOrder();
  }, [user, authLoading]);

  const cfg = statusConfig[order?.status ?? "pending"] ?? statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-screen flex flex-col bg-vendel-cream">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <Button variant="ghost" className="mb-6 text-vendel-brown" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <h1 className="font-playfair text-3xl font-bold text-vendel-brown mb-6">Order Status</h1>

        {loading || authLoading ? (
          <p className="text-vendel-brown/60">Loading…</p>
        ) : !user ? (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-vendel-brown/70">Please sign in to view your orders.</p>
              <Button onClick={() => navigate("/admin/login")} className="bg-vendel-brown hover:bg-vendel-brown/90 text-vendel-cream">
                Sign In
              </Button>
            </CardContent>
          </Card>
        ) : !order ? (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <Package className="mx-auto h-12 w-12 text-vendel-brown/30" />
              <p className="text-vendel-brown/70">You haven't placed any orders yet.</p>
              <Button onClick={() => navigate("/shop")} className="bg-vendel-brown hover:bg-vendel-brown/90 text-vendel-cream">
                Browse Shop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Status banner */}
            <Card className="border-vendel-brown/20">
              <CardContent className="py-6 flex items-center gap-4">
                <StatusIcon className="h-10 w-10 text-vendel-brown" />
                <div className="flex-1">
                  <p className="text-sm text-vendel-brown/60">Order #{order.id.slice(0, 8)}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={cfg.color}>{cfg.label}</Badge>
                    {order.payment_confirmed ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">Payment Confirmed</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300">Awaiting Payment</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estimated delivery timeline */}
            {order.requested_delivery_date && order.status !== "cancelled" && (
              <Card className="border-vendel-brown/20">
                <CardHeader>
                  <CardTitle className="font-playfair text-vendel-brown text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" /> Estimated Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const placed = new Date(order.created_at);
                    const delivery = new Date(order.requested_delivery_date);
                    const now = new Date();
                    const totalMs = delivery.getTime() - placed.getTime();
                    const elapsedMs = now.getTime() - placed.getTime();
                    const progress = order.status === "delivered" ? 100 : Math.min(Math.max(Math.round((elapsedMs / totalMs) * 100), 5), 95);
                    const daysLeft = Math.max(0, Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-vendel-brown/70">
                          <span>Ordered {placed.toLocaleDateString()}</span>
                          <span>Delivery {delivery.toLocaleDateString()}</span>
                        </div>
                        <div className="w-full bg-vendel-brown/10 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-vendel-gold transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-vendel-brown/60 text-center">
                          {order.status === "delivered"
                            ? "Your order has been delivered! 🎉"
                            : daysLeft === 0
                              ? "Arriving today!"
                              : `Estimated ${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining`}
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Status history timeline */}
            <Card className="border-vendel-brown/20">
              <CardHeader>
                <CardTitle className="font-playfair text-vendel-brown text-lg">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const steps = [
                    { key: "pending", label: "Order Placed", description: "Your order has been received" },
                    { key: "confirmed", label: "Confirmed", description: "Payment verified & order confirmed" },
                    { key: "delivered", label: "Delivered", description: "Order delivered to your address" },
                  ];
                  const statusOrder = ["pending", "confirmed", "delivered"];
                  const isCancelled = order.status === "cancelled";
                  const currentIdx = statusOrder.indexOf(order.status);

                  return (
                    <div className="relative pl-8 space-y-6">
                      {steps.map((step, i) => {
                        const isCompleted = !isCancelled && currentIdx >= i;
                        const isCurrent = !isCancelled && currentIdx === i;

                        return (
                          <div key={step.key} className="relative">
                            {/* Connector line */}
                            {i < steps.length - 1 && (
                              <div
                                className={`absolute left-[-20px] top-7 w-0.5 h-[calc(100%+12px)] ${
                                  !isCancelled && currentIdx > i ? "bg-vendel-gold" : "bg-vendel-brown/15"
                                }`}
                              />
                            )}
                            {/* Dot */}
                            <div
                              className={`absolute left-[-26px] top-1 w-3 h-3 rounded-full border-2 ${
                                isCompleted
                                  ? "bg-vendel-gold border-vendel-gold"
                                  : "bg-vendel-cream border-vendel-brown/30"
                              }`}
                            />
                            <div>
                              <p className={`font-medium ${isCompleted ? "text-vendel-brown" : "text-vendel-brown/40"}`}>
                                {step.label}
                                {isCurrent && (
                                  <span className="ml-2 text-xs font-normal text-vendel-gold">← Current</span>
                                )}
                              </p>
                              <p className={`text-sm ${isCompleted ? "text-vendel-brown/60" : "text-vendel-brown/30"}`}>
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {isCancelled && (
                        <div className="relative">
                          <div className="absolute left-[-26px] top-1 w-3 h-3 rounded-full border-2 bg-red-500 border-red-500" />
                          <div>
                            <p className="font-medium text-red-700">Cancelled</p>
                            <p className="text-sm text-red-500/70">This order has been cancelled</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Order details */}
            <Card className="border-vendel-brown/20">
              <CardHeader>
                <CardTitle className="font-playfair text-vendel-brown text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-vendel-brown/60">Placed</span>
                  <span className="text-vendel-brown">{new Date(order.created_at).toLocaleDateString()}</span>
                  {order.requested_delivery_date && (
                    <>
                      <span className="text-vendel-brown/60">Delivery Date</span>
                      <span className="text-vendel-brown">{new Date(order.requested_delivery_date).toLocaleDateString()}</span>
                    </>
                  )}
                  <span className="text-vendel-brown/60">Payment</span>
                  <span className="text-vendel-brown capitalize">{order.payment_method ?? "—"}</span>
                  {order.delivery_address && (
                    <>
                      <span className="text-vendel-brown/60">Address</span>
                      <span className="text-vendel-brown">{order.delivery_address}</span>
                    </>
                  )}
                </div>

                <hr className="border-vendel-brown/10" />

                {/* Items */}
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-vendel-brown font-medium">{item.products?.name ?? "Product"}</p>
                        <p className="text-xs text-vendel-brown/60">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-vendel-brown font-semibold">Rs. {(item.unit_price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <hr className="border-vendel-brown/10" />

                <div className="flex justify-between font-bold text-vendel-brown">
                  <span>Total</span>
                  <span>Rs. {Number(order.total_amount).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderStatus;
