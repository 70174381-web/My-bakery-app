import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  leadTimeDays: number;
  availableStock?: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  maxLeadTime: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    let added = false;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      const maxStock = item.availableStock ?? existing?.availableStock ?? Infinity;
      if (existing) {
        if (existing.quantity >= maxStock) return prev;
        added = true;
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, ...item, quantity: Math.min(maxStock, i.quantity + 1) } : i
        );
      }
      if (maxStock <= 0) return prev;
      added = true;
      return [...prev, { ...item, quantity: 1 }];
    });
    return added;
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(quantity, i.availableStock ?? Infinity) }
            : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const maxLeadTime = items.length ? Math.max(...items.map((i) => i.leadTimeDays)) : 0;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, maxLeadTime }}
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
