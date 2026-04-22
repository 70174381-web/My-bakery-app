import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SHIPPING_FEE = 200; // flat estimate in Rs.

const Checkout = () => {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, maxLeadTime, clearCart } = useCart();

  const shippingEstimate = totalItems > 0 ? SHIPPING_FEE : 0;
  const grandTotal = totalPrice + shippingEstimate;

  const earliestDate = new Date();
  earliestDate.setDate(earliestDate.getDate() + maxLeadTime);
  const dateStr = earliestDate.toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-2xl text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h1 className="font-heading text-3xl text-foreground mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Browse our menu and add some treats!
            </p>
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

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-vendel-gold transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Continue shopping
            </Link>
            <h1 className="font-heading text-3xl md:text-4xl text-foreground">Checkout</h1>
            <p className="text-muted-foreground mt-1">
              {totalItems} item{totalItems !== 1 && "s"} in your cart
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.productId} className="border-border/50">
                  <CardContent className="p-4 flex gap-4">
                    {/* Image */}
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

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg text-foreground leading-tight truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Rs. {item.price.toLocaleString()} each
                      </p>

                      {/* Quantity controls */}
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

                    {/* Line total */}
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
            </div>

            {/* Order summary */}
            <div>
              <Card className="border-border/50 sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h2 className="font-heading text-xl text-foreground">Order Summary</h2>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-foreground">
                      <span>Subtotal</span>
                      <span>Rs. {totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Shipping (estimate)</span>
                      <span>Rs. {shippingEstimate.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-heading text-lg text-foreground">
                    <span>Total</span>
                    <span>Rs. {grandTotal.toLocaleString()}</span>
                  </div>

                  {maxLeadTime > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Earliest delivery: <span className="font-semibold">{dateStr}</span> (based on{" "}
                      {maxLeadTime}-day lead time)
                    </p>
                  )}

                  <Button className="w-full mt-2" size="lg" disabled>
                    Proceed to Payment
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Payment integration coming soon
                  </p>
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
