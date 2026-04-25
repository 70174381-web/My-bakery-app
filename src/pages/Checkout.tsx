import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Smartphone,
  Landmark,
  Loader2,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const BAKERY_LOCATION = { lat: 31.5204, lng: 74.3587 };
const BYKEA_BASE_FEE = 160;
const BYKEA_PER_KM = 45;

const estimateBykeaDistanceKm = (address: string) => {
  const clean = address.trim().toLowerCase();
  if (clean.length < 5) return 0;
  const knownAreas: Record<string, number> = {
    dha: 7.5,
    gulberg: 5.2,
    johar: 12.8,
    model: 8.4,
    cantt: 6.1,
    wapda: 15.6,
    bahria: 24.5,
    faisal: 9.2,
  };
  const matched = Object.entries(knownAreas).find(([area]) => clean.includes(area));
  if (matched) return matched[1];
  const addressFactor = Math.min(18, Math.max(4, Math.ceil(clean.length / 18)));
  const coordinateSeed = Math.abs(BAKERY_LOCATION.lat - BAKERY_LOCATION.lng) % 3;
  return Number((addressFactor + coordinateSeed).toFixed(1));
};

const calculateBykeaShipping = (distanceKm: number, itemCount: number) =>
  itemCount > 0 && distanceKm > 0 ? Math.ceil(BYKEA_BASE_FEE + distanceKm * BYKEA_PER_KM + Math.max(0, itemCount - 1) * 25) : 0;

type Step = "cart" | "payment" | "success";
type PaymentMethod = "card" | "easypaisa" | "bank_transfer";

const Checkout = () => {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, maxLeadTime, clearCart } =
    useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("cart");
  const [placing, setPlacing] = useState(false);

  // Contact fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("easypaisa");

  const bykeaDistanceKm = useMemo(() => estimateBykeaDistanceKm(address), [address]);
  const shippingEstimate = useMemo(() => calculateBykeaShipping(bykeaDistanceKm, totalItems), [bykeaDistanceKm, totalItems]);
  const grandTotal = totalPrice + shippingEstimate;

  const earliestDate = new Date();
  earliestDate.setDate(earliestDate.getDate() + maxLeadTime);
  const dateStr = earliestDate.toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // ── Empty cart ──
  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-2xl text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h1 className="font-heading text-3xl text-foreground mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">Browse our menu and add some treats!</p>
            <Link to="/shop">
              <Button className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Shop
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Validate before proceeding to payment ──
  const canProceedToPayment = items.length > 0;

  // ── Validate payment form ──
  const contactValid =
    name.trim().length >= 2 &&
    phone.trim().length >= 7 &&
    address.trim().length >= 5 &&
    bykeaDistanceKm > 0;

  // ── Place order ──
  const handlePlaceOrder = async () => {
    if (!contactValid) return;
    setPlacing(true);

    try {
      // If not signed in, place as guest (user_id will be a placeholder)
      const userId = user?.id;

      if (!userId) {
        toast({
          title: "Sign in required",
          description: "Please create an account or sign in to place an order.",
          variant: "destructive",
        });
        setPlacing(false);
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          total_amount: grandTotal,
          delivery_address: address,
          payment_method: paymentMethod,
          requested_delivery_date: earliestDate.toISOString().split("T")[0],
          status: "pending",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      setStep("success");
    } catch (err: any) {
      toast({
        title: "Order failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  // ── Success ──
  if (step === "success") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-lg text-center py-20">
            <CheckCircle2 className="w-16 h-16 mx-auto text-vendel-rose mb-4" />
            <h1 className="font-heading text-3xl text-foreground mb-2">Order Placed!</h1>
            <p className="text-muted-foreground mb-2">
              Thank you, {name}! Your order has been submitted.
            </p>
            {paymentMethod === "easypaisa" && (
              <Card className="border-vendel-rose/30 mt-6 text-left">
                <CardContent className="p-5 space-y-2">
                  <p className="font-heading text-base text-foreground">
                    Send Rs. {grandTotal.toLocaleString()} via EasyPaisa to:
                  </p>
                  <p className="font-body text-lg font-semibold text-vendel-rose">03304582288</p>
                  <p className="text-xs text-muted-foreground">
                    After sending, your order will be confirmed once we verify payment.
                  </p>
                </CardContent>
              </Card>
            )}
            {paymentMethod === "bank_transfer" && (
              <Card className="border-vendel-rose/30 mt-6 text-left">
                <CardContent className="p-5 space-y-2">
                  <p className="font-heading text-base text-foreground">
                    Transfer Rs. {grandTotal.toLocaleString()} to:
                  </p>
                  <p className="font-body text-sm text-foreground">
                    <span className="font-semibold">IBAN:</span> PK10TMFB0000000077895231
                  </p>
                  <p className="text-xs text-muted-foreground">
                    After transfer, your order will be confirmed once we verify payment.
                  </p>
                </CardContent>
              </Card>
            )}
            {paymentMethod === "card" && (
              <p className="text-sm text-muted-foreground mt-4">
                Card payment link will be sent to your phone/email shortly.
              </p>
            )}
            <Button className="mt-8 gap-2" onClick={() => navigate("/shop")}>
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            {step === "cart" ? (
              <Link
                to="/shop"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-vendel-rose transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Continue shopping
              </Link>
            ) : (
              <button
                onClick={() => setStep("cart")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-vendel-rose transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back to cart
              </button>
            )}
            <h1 className="font-heading text-3xl md:text-4xl text-foreground">
              {step === "cart" ? "Your Cart" : "Contact & Payment"}
            </h1>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-3">
              <span
                className={`text-xs font-body font-semibold px-3 py-1 rounded-full ${
                  step === "cart"
                    ? "bg-vendel-rose text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1. Cart
              </span>
              <span className="text-muted-foreground text-xs">→</span>
              <span
                className={`text-xs font-body font-semibold px-3 py-1 rounded-full ${
                  step === "payment"
                    ? "bg-vendel-rose text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2. Payment
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-4">
              {step === "cart" && (
                <>
                  {items.map((item) => (
                    <Card key={item.productId} className="border-border/50">
                      <CardContent className="p-4 flex gap-4">
                        <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-lg text-foreground leading-tight truncate">
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Rs. {item.price.toLocaleString()} each
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-body text-sm w-8 text-center text-foreground">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
                              onClick={() => removeItem(item.productId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-heading text-lg text-foreground">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Clear cart
                  </Button>
                </>
              )}

              {step === "payment" && (
                <div className="space-y-6">
                  {/* Contact info */}
                  <Card className="border-border/50">
                    <CardContent className="p-6 space-y-4">
                      <h2 className="font-heading text-xl text-foreground">Contact Details</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone / WhatsApp *</Label>
                          <Input
                            id="phone"
                            placeholder="03XX XXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            maxLength={20}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          maxLength={255}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Input
                          id="address"
                          placeholder="Full address for delivery"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          maxLength={500}
                        />
                        {address.trim().length >= 5 && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-vendel-rose" />
                            Bykea distance estimate: {bykeaDistanceKm.toFixed(1)} km
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment method */}
                  <Card className="border-border/50">
                    <CardContent className="p-6 space-y-4">
                      <h2 className="font-heading text-xl text-foreground">Payment Method</h2>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                        className="space-y-3"
                      >
                        {/* EasyPaisa */}
                        <label
                          htmlFor="pm-easypaisa"
                          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                            paymentMethod === "easypaisa"
                              ? "border-vendel-rose bg-vendel-rose/5"
                              : "border-border hover:border-vendel-rose/50"
                          }`}
                        >
                          <RadioGroupItem value="easypaisa" id="pm-easypaisa" className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-vendel-rose" />
                              <span className="font-heading text-base text-foreground">
                                EasyPaisa
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Send to <span className="font-semibold">03304582288</span> — we'll
                              confirm once received.
                            </p>
                          </div>
                        </label>

                        {/* Bank Transfer */}
                        <label
                          htmlFor="pm-bank"
                          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                            paymentMethod === "bank_transfer"
                              ? "border-vendel-rose bg-vendel-rose/5"
                              : "border-border hover:border-vendel-rose/50"
                          }`}
                        >
                          <RadioGroupItem value="bank_transfer" id="pm-bank" className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Landmark className="w-4 h-4 text-vendel-rose" />
                              <span className="font-heading text-base text-foreground">
                                Bank Transfer (IBAN)
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              IBAN: <span className="font-semibold">PK10TMFB0000000077895231</span>
                            </p>
                          </div>
                        </label>

                        {/* Card online */}
                        <label
                          htmlFor="pm-card"
                          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                            paymentMethod === "card"
                              ? "border-vendel-rose bg-vendel-rose/5"
                              : "border-border hover:border-vendel-rose/50"
                          }`}
                        >
                          <RadioGroupItem value="card" id="pm-card" className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-vendel-rose" />
                              <span className="font-heading text-base text-foreground">
                                Card Online
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              We'll send a payment link to your phone/email.
                            </p>
                          </div>
                        </label>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Right column — Order summary */}
            <div>
              <Card className="border-border/50 sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-heading text-xl text-foreground">Order Summary</h2>

                  {/* Item list (compact in payment step) */}
                  {step === "payment" && (
                    <div className="space-y-2 text-sm">
                      {items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-foreground">
                          <span className="truncate mr-2">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="flex-shrink-0">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <Separator />
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-foreground">
                      <span>Subtotal</span>
                      <span>Rs. {totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Bykea shipping{bykeaDistanceKm > 0 ? ` · ${bykeaDistanceKm.toFixed(1)} km` : ""}</span>
                      <span>{shippingEstimate > 0 ? `Rs. ${shippingEstimate.toLocaleString()}` : "Enter address"}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-heading text-lg text-foreground">
                    <span>Total</span>
                    <span>Rs. {grandTotal.toLocaleString()}</span>
                  </div>

                  {maxLeadTime > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Earliest delivery: <span className="font-semibold">{dateStr}</span> (
                      {maxLeadTime}-day lead time)
                    </p>
                  )}

                  {step === "cart" && (
                    <Button
                      className="w-full mt-2 gap-2"
                      size="lg"
                      disabled={!canProceedToPayment}
                      onClick={() => setStep("payment")}
                    >
                      Continue to Payment <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}

                  {step === "payment" && (
                    <Button
                      className="w-full mt-2 gap-2"
                      size="lg"
                      disabled={!contactValid || placing}
                      onClick={handlePlaceOrder}
                    >
                      {placing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Placing order…
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  )}

                  {step === "payment" && !contactValid && (
                    <p className="text-xs text-center text-muted-foreground">
                      Fill in all required fields to place your order
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
