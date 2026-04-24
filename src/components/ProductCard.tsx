import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, Clock, AlertTriangle } from "lucide-react";
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

  const handleAdd = () => {
    addItem({
      productId: id,
      name,
      price,
      imageUrl,
      leadTimeDays,
    });
    toast({ title: "Added to cart", description: `${name} added!` });
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
          {!inStock && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" /> Unavailable
            </Badge>
          )}
        </div>

        {dailyCapacity && inStock && (
          <Badge className="absolute top-2 right-2 text-xs bg-accent text-accent-foreground">
            Limited
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-heading text-lg text-foreground leading-tight">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
        </div>

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
