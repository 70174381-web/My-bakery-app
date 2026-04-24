import { useState, useMemo } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Link2, Search } from "lucide-react";

interface Variant {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  in_stock: boolean;
  daily_capacity: number | null;
}

interface AttachedVariant extends Variant {
  link_id: string;
  sort_order: number;
}

interface Props {
  productId: string | null;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VariantManager = ({ productId, productName, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // New-variant form
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [newImage, setNewImage] = useState("");

  // Attached variants for this product
  const { data: attached, isLoading } = useQuery({
    queryKey: ["attached-variants", productId],
    queryFn: async (): Promise<AttachedVariant[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_variant_links")
        .select("id, sort_order, variant:product_variants(*)")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? [])
        .filter((r: any) => r.variant)
        .map((r: any) => ({
          ...r.variant,
          link_id: r.id,
          sort_order: r.sort_order,
        }));
    },
    enabled: !!productId && open,
  });

  // All variants in the shared library
  const { data: library } = useQuery({
    queryKey: ["variant-library"],
    queryFn: async (): Promise<Variant[]> => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const attachedIds = useMemo(
    () => new Set((attached ?? []).map((a) => a.id)),
    [attached]
  );

  const available = useMemo(
    () =>
      (library ?? [])
        .filter((v) => !attachedIds.has(v.id))
        .filter((v) => v.name.toLowerCase().includes(search.toLowerCase())),
    [library, attachedIds, search]
  );

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["attached-variants", productId] });
    qc.invalidateQueries({ queryKey: ["variant-library"] });
  };

  const attachVariant = async (variantId: string) => {
    if (!productId) return;
    setBusy(true);
    const nextOrder = (attached?.length ?? 0);
    const { error } = await supabase.from("product_variant_links").insert({
      product_id: productId,
      variant_id: variantId,
      sort_order: nextOrder,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Attach failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Variant attached" });
    setPickerOpen(false);
    setSearch("");
    refresh();
  };

  const detachVariant = async (linkId: string) => {
    const { error } = await supabase
      .from("product_variant_links")
      .delete()
      .eq("id", linkId);
    if (error) {
      toast({ title: "Remove failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Variant removed", description: "It's still in the shared library." });
    refresh();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    if (!attached) return;
    const target = idx + dir;
    if (target < 0 || target >= attached.length) return;
    const a = attached[idx];
    const b = attached[target];

    setBusy(true);
    const { error: e1 } = await supabase
      .from("product_variant_links")
      .update({ sort_order: b.sort_order })
      .eq("id", a.link_id);
    const { error: e2 } = await supabase
      .from("product_variant_links")
      .update({ sort_order: a.sort_order })
      .eq("id", b.link_id);
    setBusy(false);

    if (e1 || e2) {
      toast({ title: "Reorder failed", variant: "destructive" });
      return;
    }
    refresh();
  };

  const createAndAttach = async () => {
    if (!newName.trim() || !newPrice) {
      toast({ title: "Name and price required", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        name: newName.trim(),
        price: Number(newPrice),
        image_url: newImage || null,
        daily_capacity: newCapacity ? Number(newCapacity) : null,
      })
      .select()
      .single();

    if (error || !data) {
      setBusy(false);
      toast({ title: "Create failed", description: error?.message, variant: "destructive" });
      return;
    }

    const { error: linkErr } = await supabase.from("product_variant_links").insert({
      product_id: productId!,
      variant_id: data.id,
      sort_order: attached?.length ?? 0,
    });
    setBusy(false);

    if (linkErr) {
      toast({ title: "Attach failed", description: linkErr.message, variant: "destructive" });
      return;
    }

    toast({ title: "Variant created & attached" });
    setNewName("");
    setNewPrice("");
    setNewCapacity("");
    setNewImage("");
    setCreateOpen(false);
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Variants — {productName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Attached list */}
            <div className="space-y-2">
              {(!attached || attached.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                  No variants attached. Use the buttons below to add some.
                </p>
              )}

              {attached?.map((v, idx) => (
                <Card key={v.link_id} className="border-border/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0 || busy}
                        onClick={() => move(idx, -1)}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === attached.length - 1 || busy}
                        onClick={() => move(idx, 1)}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="w-12 h-12 rounded-md bg-muted overflow-hidden shrink-0">
                      {v.image_url && (
                        <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{v.name}</p>
                        {!v.in_stock && (
                          <span className="text-xs text-destructive">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Rs. {Number(v.price).toLocaleString()}
                        {v.daily_capacity != null && ` · ${v.daily_capacity}/day`}
                      </p>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove "{v.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This only detaches it from {productName}. The variant stays in
                            your shared library.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => detachVariant(v.link_id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action row */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 min-w-[180px]">
                    <Link2 className="w-4 h-4 mr-2" /> Attach existing
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search variants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-9"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {available.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6 px-3">
                        {library?.length === 0
                          ? "Library is empty. Create a new variant first."
                          : "No matching variants available."}
                      </p>
                    ) : (
                      available.map((v) => (
                        <button
                          key={v.id}
                          disabled={busy}
                          onClick={() => attachVariant(v.id)}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{v.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Rs. {Number(v.price).toLocaleString()}
                            </p>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="default"
                className="flex-1 min-w-[180px]"
                onClick={() => setCreateOpen((o) => !o)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createOpen ? "Cancel new variant" : "Create new variant"}
              </Button>
            </div>

            {/* Inline create form */}
            {createOpen && (
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        placeholder="e.g. 1lb"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Price (Rs.) *</Label>
                      <Input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Daily quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Unlimited"
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        placeholder="https://..."
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={createAndAttach}
                    disabled={busy}
                  >
                    {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create & attach
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VariantManager;
