import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Search, X } from "lucide-react";

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: ratings } = useQuery({
    queryKey: ["product-ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("product_id, rating")
        .eq("status", "approved");
      if (error) throw error;
      const map = new Map<string, { sum: number; count: number }>();
      (data ?? []).forEach((r) => {
        if (!r.product_id) return;
        const cur = map.get(r.product_id) ?? { sum: 0, count: 0 };
        cur.sum += r.rating;
        cur.count += 1;
        map.set(r.product_id, cur);
      });
      const result: Record<string, { avg: number; count: number }> = {};
      map.forEach((v, k) => { result[k] = { avg: v.sum / v.count, count: v.count }; });
      return result;
    },
  });

  // Debug check: log loaded categories and counts so we can confirm DB coverage
  const categoryCounts: Record<string, number> = {};
  (products ?? []).forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
  });
  const dbCategories = Object.keys(categoryCounts).sort();

  useEffect(() => {
    if (isLoading) return;
    if (isError) {
      // eslint-disable-next-line no-console
      console.error("[Shop debug] Products query failed:", error);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(
      `[Shop debug] Loaded ${products?.length ?? 0} products across ${dbCategories.length} categories:`,
      categoryCounts
    );
  }, [isLoading, isError, error, products?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = ["all", ...dbCategories];
  const filteringDisabled = isError || isLoading;

  const categoryFiltered =
    activeCategory === "all" || filteringDisabled
      ? products
      : products?.filter((p) => p.category === activeCategory);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filtered = trimmedQuery
    ? categoryFiltered?.filter((p) => p.name.toLowerCase().includes(trimmedQuery))
    : categoryFiltered;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="font-cursive text-vendel-rose text-2xl mb-2">Fresh from the oven</p>
            <h1 className="font-heading text-4xl md:text-5xl text-foreground">Our Menu</h1>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Handcrafted with love — cakes need 3 days notice, cookies &amp; treats are often same-day!
            </p>
          </div>

          {isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Couldn't load products</AlertTitle>
              <AlertDescription>
                {(error as Error)?.message ?? "Please refresh the page or try again shortly."}{" "}
                Filtering is disabled until the menu loads.
              </AlertDescription>
            </Alert>
          )}

          {/* Debug summary (only when products are loaded) */}
          {!isLoading && !isError && products && (
            <p className="text-center text-xs text-muted-foreground mb-4">
              Showing {products.length} products across {dbCategories.length} categories
              {dbCategories.length > 0 && `: ${dbCategories.join(", ")}`}
            </p>
          )}

          {/* Search bar */}
          <div className="max-w-md mx-auto mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={filteringDisabled}
              className="pl-9 pr-9"
              aria-label="Search products by name"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                disabled={filteringDisabled}
                className="capitalize"
              >
                {cat}
                {cat !== "all" && categoryCounts[cat] != null && (
                  <span className="ml-1.5 text-xs opacity-70">({categoryCounts[cat]})</span>
                )}
              </Button>
            ))}
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  imageUrl={product.image_url}
                  category={product.category}
                  inStock={product.in_stock}
                  leadTimeDays={product.lead_time_days}
                  dailyCapacity={product.daily_capacity}
                  ratingAverage={ratings?.[product.id]?.avg ?? null}
                  ratingCount={ratings?.[product.id]?.count ?? 0}
                />
              ))}
            </div>
          ) : !isError ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {activeCategory === "all"
                  ? "No products yet — check back soon!"
                  : `No ${activeCategory} available right now.`}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
