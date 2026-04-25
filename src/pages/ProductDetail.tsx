import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Clock, Package, Calendar, ArrowLeft, Minus, Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleAdd = () => {
    if (!product) return;
    let addedCount = 0;
    for (let i = 0; i < quantity; i++) {
      const added = addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
        leadTimeDays: product.lead_time_days,
        availableStock: product.daily_capacity ?? null,
      });
      if (added) addedCount += 1;
    }
    toast({
      title: addedCount > 0 ? "Added to cart" : "Stock limit reached",
      description: addedCount > 0 ? `${addedCount} × ${product.name} added!` : `Only ${maxQty} available for this item.`,
      variant: addedCount > 0 ? "default" : "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <h1 className="font-heading text-3xl">Product not found</h1>
          <Button onClick={() => navigate("/shop")}>Back to Shop</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const earliestDate = new Date();
  earliestDate.setDate(earliestDate.getDate() + product.lead_time_days);
  const dateStr = earliestDate.toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const maxQty = product.daily_capacity ?? 99;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to menu
          </Link>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <Badge variant="secondary" className="capitalize mb-3">
                  {product.category}
                </Badge>
                <h1 className="font-heading text-3xl md:text-4xl text-foreground">
                  {product.name}
                </h1>
                <p className="font-heading text-2xl text-accent mt-3">
                  Rs. {product.price.toLocaleString()}
                </p>
              </div>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Qualities / Info cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lead time</p>
                      <p className="text-sm font-medium">
                        {product.lead_time_days === 0
                          ? "Same-day"
                          : `${product.lead_time_days} day${product.lead_time_days > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Earliest</p>
                      <p className="text-sm font-medium">{dateStr}</p>
                    </div>
                  </CardContent>
                </Card>

                {product.daily_capacity && (
                  <Card className="border-border/50 col-span-2">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Package className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Daily availability</p>
                        <p className="text-sm font-medium">
                          Up to {product.daily_capacity} per day — limited batch
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {!product.in_stock && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Currently unavailable
                </div>
              )}

              {/* Quantity + Add */}
              {product.in_stock && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium block mb-2">Quantity</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-heading text-xl w-12 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {product.daily_capacity && (
                        <span className="text-xs text-muted-foreground ml-2">
                          Max {maxQty}/day
                        </span>
                      )}
                    </div>
                  </div>

                  <Button size="lg" className="w-full gap-2" onClick={handleAdd}>
                    <ShoppingCart className="w-5 h-5" />
                    Add {quantity} to cart — Rs. {(product.price * quantity).toLocaleString()}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
