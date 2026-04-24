import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

interface VariantRow {
  id?: string;
  _isNew?: boolean;
  name: string;
  price: string;
  image_url: string;
  in_stock: boolean;
  daily_capacity: string;
  sort_order: number;
}

interface Props {
  productId: string | null;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toRow = (v: any): VariantRow => ({
  id: v.id,
  name: v.name,
  price: String(v.price),
  image_url: v.image_url ?? "",
  in_stock: v.in_stock,
  daily_capacity: v.daily_capacity != null ? String(v.daily_capacity) : "",
  sort_order: v.sort_order ?? 0,
});

const VariantManager = ({ productId, productName, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      setRows(data.map(toRow));
      return data;
    },
    enabled: !!productId && open,
  });

  const updateRow = (idx: number, patch: Partial<VariantRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addBlank = () => {
    setRows((prev) => [
      ...prev,
      {
        _isNew: true,
        name: "",
        price: "",
        image_url: "",
        in_stock: true,
        daily_capacity: "",
        sort_order: prev.length,
      },
    ]);
  };

  const saveRow = async (idx: number) => {
    const r = rows[idx];
    if (!r.name.trim() || !r.price) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    setSavingId(r.id ?? `new-${idx}`);

    const payload = {
      product_id: productId!,
      name: r.name.trim(),
      price: Number(r.price),
      image_url: r.image_url || null,
      in_stock: r.in_stock,
      daily_capacity: r.daily_capacity ? Number(r.daily_capacity) : null,
      sort_order: r.sort_order,
    };

    const { data, error } = r.id
      ? await supabase
          .from("product_variants")
          .update(payload)
          .eq("id", r.id)
          .select()
          .single()
      : await supabase.from("product_variants").insert(payload).select().single();

    setSavingId(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((row, i) => (i === idx ? toRow(data) : row)));
    toast({ title: r.id ? "Variant updated" : "Variant added" });
    qc.invalidateQueries({ queryKey: ["product-variants", productId] });
  };

  const deleteRow = async (idx: number) => {
    const r = rows[idx];
    if (!r.id) {
      setRows((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    const { error } = await supabase.from("product_variants").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
    toast({ title: "Variant deleted" });
    qc.invalidateQueries({ queryKey: ["product-variants", productId] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Variants — {productName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No variants yet. Add sizes or flavors below.
              </p>
            )}

            {rows.map((r, idx) => (
              <Card key={r.id ?? `new-${idx}`} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Variant name *</Label>
                      <Input
                        placeholder="e.g. 1lb, Chocolate"
                        value={r.name}
                        onChange={(e) => updateRow(idx, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Price (Rs.) *</Label>
                      <Input
                        type="number"
                        value={r.price}
                        onChange={(e) => updateRow(idx, { price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Daily quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Unlimited"
                        value={r.daily_capacity}
                        onChange={(e) =>
                          updateRow(idx, { daily_capacity: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        placeholder="https://..."
                        value={r.image_url}
                        onChange={(e) => updateRow(idx, { image_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`stock-${idx}`}
                        checked={r.in_stock}
                        onCheckedChange={(v) => updateRow(idx, { in_stock: v })}
                      />
                      <Label htmlFor={`stock-${idx}`} className="text-sm">
                        {r.in_stock ? "Active" : "Deactivated"}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete variant?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{r.name || "Untitled"}" will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRow(idx)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        size="sm"
                        onClick={() => saveRow(idx)}
                        disabled={savingId === (r.id ?? `new-${idx}`)}
                      >
                        {savingId === (r.id ?? `new-${idx}`) ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full" onClick={addBlank}>
              <Plus className="w-4 h-4 mr-2" /> Add variant
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VariantManager;
