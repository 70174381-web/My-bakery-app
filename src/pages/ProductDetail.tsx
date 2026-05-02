import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart, stockToast } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Clock, Package, Calendar, ArrowLeft, Minus, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductReviews from "@/components/ProductReviews";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

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

  const { data: variants } = useQuery({
    queryKey: ["product-variants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variant_links")
        .select("variant_id, sort_order, product_variants:variant_id (id, name, price, image_url, in_stock, daily_capacity)")
        .eq("product_id", id!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .map((row: any) => row.product_variants)
        .filter(Boolean) as Array<{
          id: string; name: string; price: number; image_url: string | null; in_stock: boolean; daily_capacity: number | null;
        }>;
    },
    enabled: !!id,
  });

  const selectedVariant = useMemo(
    () => variants?.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId]
  );

  // Effective values: variant overrides product when chosen
  const effective = useMemo(() => {
    if (!product) return null;
    if (selectedVariant) {
      return {
        price: Number(selectedVariant.price),
        imageUrl: selectedVariant.image_url ?? product.image_url,
        inStock: selectedVariant.in_stock,
        dailyCapacity: selectedVariant.daily_capacity,
        label: ` · ${selectedVariant.name}`,
      };
    }
    return {
      price: Number(product.price),
      imageUrl: product.image_url,
      inStock: product.in_stock,
      dailyCapacity: product.daily_capacity,
      label: "",
    };
  }, [product, selectedVariant]);

  const maxQty = effective?.dailyCapacity ?? 99;

  const handleAdd = () => {
    if (!product || !effective) return;
    if (variants && variants.length > 0 && !selectedVariant) {
      toast({
        title: "Choose an option",
        description: "Please select a variant before adding to cart.",
        variant: "destructive",
      });
      return;
    }
    let addedCount = 0;
    let lastResult: ReturnType<typeof addItem> | undefined;
    for (let i = 0; i < quantity; i++) {
      const result = addItem({
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        variantName: selectedVariant?.name ?? null,
        name: product.name,
        price: effective.price,
        imageUrl: effective.imageUrl,
        leadTimeDays: product.lead_time_days,
        availableStock: effective.dailyCapacity ?? null,
      });
      lastResult = result;
      if (result.ok) addedCount += 1;
      else break;
    }
    const labelName = `${product.name}${effective.label}`;
    if (addedCount > 0) {
      toast(stockToast(labelName, { ok: true, quantity: addedCount, remaining: lastResult && lastResult.ok ? lastResult.remaining : null }));
    } else if (lastResult) {
      toast(stockToast(labelName, lastResult));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product || !effective) {
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

  const hasVariants = (variants?.length ?? 0) > 0;
  const requiresVariantPick = hasVariants && !selectedVariant;
  const atCap = quantity >= maxQty;
  const variantUnavailable = !!selectedVariant && (
    !selectedVariant.in_stock ||
    (selectedVariant.daily_capacity != null && selectedVariant.daily_capacity <= 0)
  );

  // Auto-clear the chosen variant if it becomes unavailable (e.g. admin updates stock).
  useEffect(() => {
    if (!selectedVariant) return;
    if (variantUnavailable) {
      setSelectedVariantId("");
      setQuantity(1);
      toast({
        title: "Variant unavailable",
        description: `“${selectedVariant.name}” just went out of stock — please pick another option.`,
        variant: "destructive",
      });
    }
  }, [variantUnavailable, selectedVariant, toast]);

  const addDisabled =
    !effective?.inStock ||
    requiresVariantPick ||
    variantUnavailable ||
    (effective?.dailyCapacity != null && effective.dailyCapacity <= 0);

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
              {effective.imageUrl ? (
                <img
                  src={effective.imageUrl}
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
                  {effective.label && <span className="text-2xl text-muted-foreground"> {effective.label}</span>}
                </h1>
                <p className="font-heading text-2xl text-accent mt-3">
                  Rs. {effective.price.toLocaleString()}
                </p>
              </div>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Variant selector */}
              {hasVariants && (
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Choose option *</label>
                  <Select value={selectedVariantId} onValueChange={(v) => { setSelectedVariantId(v); setQuantity(1); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a variant…" />
                    </SelectTrigger>
                    <SelectContent>
                      {variants!.map((v) => (
                        <SelectItem key={v.id} value={v.id} disabled={!v.in_stock || (v.daily_capacity != null && v.daily_capacity <= 0)}>
                          <span className="flex items-center gap-2">
                            <span>{v.name}</span>
                            <span className="text-muted-foreground">— Rs. {Number(v.price).toLocaleString()}</span>
                            {!v.in_stock || (v.daily_capacity != null && v.daily_capacity <= 0)
                              ? <span className="text-xs text-destructive">· Sold out</span>
                              : v.daily_capacity != null
                                ? <span className="text-xs text-muted-foreground">· {v.daily_capacity}/day</span>
                                : null}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedVariant && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                      {selectedVariant.daily_capacity != null
                        ? `Up to ${selectedVariant.daily_capacity} of "${selectedVariant.name}" available per day`
                        : `"${selectedVariant.name}" available`}
                    </p>
                  )}
                </div>
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

                {effective.dailyCapacity && (
                  <Card className="border-border/50 col-span-2">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Package className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Daily availability</p>
                        <p className="text-sm font-medium">
                          Up to {effective.dailyCapacity} per day — limited batch
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {!effective.inStock && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Currently unavailable
                </div>
              )}

              {/* Quantity + Add */}
              {effective.inStock && !requiresVariantPick && (
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
                        disabled={atCap}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      {effective.dailyCapacity && (
                        <span className="text-xs text-muted-foreground ml-2">
                          Max {maxQty}/day
                        </span>
                      )}
                    </div>
                    {atCap && effective.dailyCapacity != null && (
                      <p className="mt-2 text-xs text-vendel-rose font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Max {effective.dailyCapacity} available — daily capacity reached
                      </p>
                    )}
                  </div>

                  <Button size="lg" className="w-full gap-2" onClick={handleAdd}>
                    <ShoppingCart className="w-5 h-5" />
                    Add {quantity} to cart — Rs. {(effective.price * quantity).toLocaleString()}
                  </Button>
                </div>
              )}

              {requiresVariantPick && (
                <p className="text-sm text-muted-foreground italic">
                  Select an option above to add this product to your cart.
                </p>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-16">
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
