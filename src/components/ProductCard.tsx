import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  inStock: boolean;
  leadTimeDays: number;
  dailyCapacity: number | null;
}

const ProductCard = ({
  id, name, description, price, imageUrl, category, inStock, leadTimeDays, dailyCapacity,
}: ProductCardProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const maxStock = dailyCapacity ?? null;
  const leadLabel = leadTimeDays === 0 ? "Same-day" : `${leadTimeDays}d lead`;

  const handleAdd = () => {
    const added = addItem({
      productId: id,
      name,
      price,
      imageUrl,
      leadTimeDays,
      availableStock: maxStock,
    });
    toast(
      added
        ? { title: "Added to cart", description: `${name} added!` }
        : { title: "Stock limit reached", description: `Only ${maxStock ?? 0} available for this item.`, variant: "destructive" }
    );
  };

  const earliestDate = new Date();
  earliestDate.setDate(earliestDate.getDate() + leadTimeDays);
  const dateStr = earliestDate.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-shadow group">
      <Link to={`/product/${id}`} className="block">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge variant="secondary" className="text-xs capitalize bg-card/90 backdrop-blur-sm">
              {category}
            </Badge>
            <Badge
              variant={inStock ? "secondary" : "destructive"}
              className="text-xs gap-1 bg-card/90 backdrop-blur-sm"
            >
              {inStock ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {inStock ? "Available" : "Sold out"}
            </Badge>
          </div>

          <Badge className="absolute top-2 right-2 text-xs bg-accent text-accent-foreground">
            {dailyCapacity && inStock ? `${dailyCapacity}/day` : leadLabel}
          </Badge>
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        <Link to={`/product/${id}`} className="block hover:text-accent transition-colors">
          <h3 className="font-heading text-lg text-foreground leading-tight">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
        </Link>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {leadTimeDays === 0
              ? "Same-day available"
              : `${leadTimeDays}-day notice · Earliest: ${dateStr}`}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="font-heading text-xl text-foreground">
            Rs. {price.toLocaleString()}
          </span>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!inStock}
            className="gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            {inStock ? "Add" : "Sold out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
