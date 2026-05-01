import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CartItem {
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  leadTimeDays: number;
  availableStock?: number | null;
}

export type StockResult =
  | { ok: true; quantity: number; remaining: number | null }
  | { ok: false; reason: "out_of_stock" | "cap_reached"; available: number };

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => StockResult;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => StockResult;
  setQuantityFromInput: (key: string, raw: string) => StockResult;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  maxLeadTime: number;
  getLineKey: (productId: string, variantId?: string | null) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const lineKey = (productId: string, variantId?: string | null) =>
  variantId ? `${productId}::${variantId}` : productId;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">): StockResult => {
    const key = lineKey(item.productId, item.variantId);
    let result: StockResult = { ok: false, reason: "cap_reached", available: 0 };
    setItems((prev) => {
      const existing = prev.find((i) => lineKey(i.productId, i.variantId) === key);
      const maxStock = item.availableStock ?? existing?.availableStock ?? Infinity;
      if (maxStock <= 0) {
        result = { ok: false, reason: "out_of_stock", available: 0 };
        return prev;
      }
      if (existing) {
        if (existing.quantity >= maxStock) {
          result = { ok: false, reason: "cap_reached", available: maxStock === Infinity ? Number.MAX_SAFE_INTEGER : maxStock };
          return prev;
        }
        const nextQty = Math.min(maxStock, existing.quantity + 1);
        result = { ok: true, quantity: nextQty, remaining: maxStock === Infinity ? null : maxStock - nextQty };
        return prev.map((i) =>
          lineKey(i.productId, i.variantId) === key ? { ...i, ...item, quantity: nextQty } : i
        );
      }
      result = { ok: true, quantity: 1, remaining: maxStock === Infinity ? null : maxStock - 1 };
      return [...prev, { ...item, quantity: 1 }];
    });
    return result;
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.variantId) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number): StockResult => {
    let result: StockResult = { ok: true, quantity, remaining: null };
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => lineKey(i.productId, i.variantId) !== key));
      return { ok: true, quantity: 0, remaining: null };
    }
    setItems((prev) =>
      prev.map((i) => {
        if (lineKey(i.productId, i.variantId) !== key) return i;
        const max = i.availableStock ?? Infinity;
        if (quantity > max) {
          result = { ok: false, reason: "cap_reached", available: max === Infinity ? Number.MAX_SAFE_INTEGER : max };
          return { ...i, quantity: max === Infinity ? quantity : max };
        }
        result = { ok: true, quantity, remaining: max === Infinity ? null : max - quantity };
        return { ...i, quantity };
      })
    );
    return result;
  }, []);

  const setQuantityFromInput = useCallback((key: string, raw: string): StockResult => {
    const parsed = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    if (isNaN(parsed) || parsed < 1) {
      return updateQuantity(key, 1);
    }
    return updateQuantity(key, parsed);
  }, [updateQuantity]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const maxLeadTime = items.length ? Math.max(...items.map((i) => i.leadTimeDays)) : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        setQuantityFromInput,
        clearCart,
        totalItems,
        totalPrice,
        maxLeadTime,
        getLineKey: lineKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

// Shared toast wording so add-to-cart and quantity-change feel consistent.
export const stockToast = (name: string, result: StockResult) => {
  if (result.ok) {
    const remaining = result.remaining;
    return {
      title: "Added to cart",
      description:
        remaining === null
          ? `${name} added.`
          : remaining === 0
            ? `${name} added — that's the last one!`
            : `${name} added — only ${remaining} left.`,
    };
  }
  if (result.reason === "out_of_stock") {
    return {
      title: "Sold out",
      description: `${name} is currently unavailable.`,
      variant: "destructive" as const,
    };
  }
  return {
    title: "Stock limit reached",
    description: `Only ${result.available} left of ${name}.`,
    variant: "destructive" as const,
  };
};
