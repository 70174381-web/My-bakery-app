import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  Star,
  ShieldAlert,
  Inbox,
  ShieldCheck,
  Trash2,
  RotateCcw,
  LogOut,
} from "lucide-react";

type Status = "pending" | "approved" | "rejected";

interface ReviewRow {
  id: string;
  product_id: string | null;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string;
  status: Status;
  rejection_reason: string | null;
  created_at: string;
  user_id: string | null;
}

const StarRow = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < value ? "fill-vendel-gold text-vendel-gold" : "text-muted-foreground/40"}`}
      />
    ))}
  </div>
);

const statusBadge = (status: Status) => {
  if (status === "approved")
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30">Approved</Badge>;
  if (status === "rejected")
    return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20 border-destructive/30">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
};

const AdminReviews = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>("pending");
  const [rejectTarget, setRejectTarget] = useState<ReviewRow | null>(null);
  const [reason, setReason] = useState("");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-name-map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { map[p.id] = p.name; });
      return map;
    },
  });

  const counts = useQuery({
    queryKey: ["admin-review-counts"],
    queryFn: async () => {
      const ids: Status[] = ["pending", "approved", "rejected"];
      const out: Record<Status, number> = { pending: 0, approved: 0, rejected: 0 };
      await Promise.all(ids.map(async (s) => {
        const { count } = await supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", s);
        out[s] = count ?? 0;
      }));
      return out;
    },
  });

  const moderate = useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: Status; rejection_reason?: string | null }) => {
      const update: any = { status };
      if (status === "rejected") update.rejection_reason = rejection_reason ?? null;
      if (status === "approved") update.rejection_reason = null;
      const { error } = await supabase.from("reviews").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review-counts"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (e: any) => toast({ title: "Action failed", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Review deleted" });
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review-counts"] });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const handleApprove = (r: ReviewRow) => {
    moderate.mutate(
      { id: r.id, status: "approved" },
      { onSuccess: () => toast({ title: "Review approved", description: `“${r.title ?? r.body.slice(0, 30)}…” is now live.` }) }
    );
  };

  const submitReject = () => {
    if (!rejectTarget) return;
    if (reason.trim().length < 3) {
      toast({ title: "Reason required", description: "Please add a short reason (3+ chars).", variant: "destructive" });
      return;
    }
    moderate.mutate(
      { id: rejectTarget.id, status: "rejected", rejection_reason: reason.trim() },
      {
        onSuccess: () => {
          toast({ title: "Review rejected" });
          setRejectTarget(null);
          setReason("");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/dashboard"><ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard</Link>
          </Button>
          <div>
            <h1 className="font-heading text-2xl text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-vendel-rose" /> Review moderation
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Inbox className="w-4 h-4" /> Pending
              <Badge variant="secondary" className="ml-1">{counts.data?.pending ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <ShieldAlert className="w-4 h-4" /> Rejected
              <Badge variant="secondary" className="ml-1">{counts.data?.rejected ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <ShieldCheck className="w-4 h-4" /> Approved
              <Badge variant="secondary" className="ml-1">{counts.data?.approved ?? 0}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : reviews && reviews.length > 0 ? (
              reviews.map((r) => {
                const productName = r.product_id ? products?.[r.product_id] ?? "Unknown product" : "—";
                return (
                  <Card key={r.id} className="border-border/50">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StarRow value={r.rating} />
                            {statusBadge(r.status)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">{r.reviewer_name}</span>
                            <span className="text-muted-foreground"> · on </span>
                            <span className="font-medium">{productName}</span>
                            {r.user_id ? (
                              <span className="text-xs text-emerald-600 ml-1">· verified account</span>
                            ) : (
                              <span className="text-xs text-muted-foreground ml-1">· guest</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.status !== "approved" && (
                            <Button size="sm" onClick={() => handleApprove(r)} disabled={moderate.isPending} className="gap-1.5">
                              <Check className="w-4 h-4" /> Approve
                            </Button>
                          )}
                          {r.status === "approved" && (
                            <Button size="sm" variant="outline" onClick={() => { setRejectTarget(r); setReason(r.rejection_reason ?? ""); }} className="gap-1.5">
                              <RotateCcw className="w-4 h-4" /> Unpublish
                            </Button>
                          )}
                          {r.status !== "rejected" && r.status !== "approved" && (
                            <Button size="sm" variant="outline" onClick={() => { setRejectTarget(r); setReason(r.rejection_reason ?? ""); }} className="gap-1.5">
                              <X className="w-4 h-4" /> Reject
                            </Button>
                          )}
                          {r.status === "rejected" && (
                            <Button size="sm" variant="outline" onClick={() => { setRejectTarget(r); setReason(r.rejection_reason ?? ""); }} className="gap-1.5">
                              <X className="w-4 h-4" /> Edit reason
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)} disabled={remove.isPending}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {r.title && <h3 className="font-heading text-base">{r.title}</h3>}
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{r.body}</p>

                      {r.rejection_reason && (
                        <div className="text-xs flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive">
                          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span><strong>Reason:</strong> {r.rejection_reason}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-dashed border-border/50">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No {tab} reviews.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject review</DialogTitle>
            <DialogDescription>
              The reason is stored with the review and helps the team learn the spam patterns over time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="e.g. Promotional link, off-topic, abusive language…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{reason.length}/300</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setReason(""); }}>Cancel</Button>
            <Button onClick={submitReject} disabled={moderate.isPending} className="gap-2">
              {moderate.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
