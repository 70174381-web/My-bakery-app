import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquareReply } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Quote {
  id: string;
  customer_name: string;
  contact: string;
  request_type: string;
  occasion: string | null;
  servings: number | null;
  needed_by: string | null;
  budget: string | null;
  details: string;
  status: string;
  offered_price: number | null;
  admin_message: string | null;
  responded_at: string | null;
  created_at: string;
}

const responseSchema = z.object({
  offered_price: z.coerce.number().positive("Enter a price greater than 0").max(10_000_000),
  admin_message: z.string().trim().min(5, "Add a short message").max(1000),
});

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    new: "bg-yellow-100 text-yellow-900 border-yellow-300",
    approved: "bg-green-100 text-green-900 border-green-300",
    rejected: "bg-red-100 text-red-900 border-red-300",
  };
  return map[status] || "bg-muted text-foreground";
};

const AdminQuotes = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState("new");
  const [editing, setEditing] = useState<Quote | null>(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_quotes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
  });

  const filtered = quotes.filter((q) => q.status === tab);

  const openDialog = (q: Quote, decision: "approved" | "rejected") => {
    setEditing({ ...q, status: decision });
    setPrice(q.offered_price?.toString() ?? "");
    setMessage(q.admin_message ?? "");
  };

  const submit = async () => {
    if (!editing) return;
    const decision = editing.status;

    if (decision === "approved") {
      const parsed = responseSchema.safeParse({ offered_price: price, admin_message: message });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
    } else if (message.trim().length < 5) {
      toast.error("Please share a short reason for the customer");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("custom_quotes")
      .update({
        status: decision,
        offered_price: decision === "approved" ? Number(price) : null,
        admin_message: message.trim(),
        responded_at: new Date().toISOString(),
      })
      .eq("id", editing.id);
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Quote ${decision}`);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-quotes"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          </Button>
          <h1 className="font-heading text-2xl">Custom Quotes</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="new">New ({quotes.filter(q => q.status === "new").length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({quotes.filter(q => q.status === "approved").length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({quotes.filter(q => q.status === "rejected").length})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No quotes here.</p>
            ) : (
              filtered.map((q) => (
                <Card key={q.id} className="border-border">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-wrap justify-between gap-2 items-start">
                      <div>
                        <h3 className="font-heading text-lg">{q.customer_name}</h3>
                        <p className="text-sm text-muted-foreground">{q.contact} • {new Date(q.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge className={statusBadge(q.status)}>{q.status}</Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <span><b>Type:</b> {q.request_type}</span>
                      <span><b>Occasion:</b> {q.occasion || "—"}</span>
                      <span><b>Servings:</b> {q.servings ?? "—"}</span>
                      <span><b>Needed by:</b> {q.needed_by || "—"}</span>
                      <span><b>Budget:</b> {q.budget || "—"}</span>
                      {q.offered_price && <span><b>Offered:</b> Rs. {Number(q.offered_price).toLocaleString()}</span>}
                    </div>

                    <p className="text-sm whitespace-pre-wrap bg-muted/40 p-3 rounded">{q.details}</p>

                    {q.admin_message && (
                      <div className="text-sm border-l-2 border-vendel-rose pl-3 text-foreground/80">
                        <b>Your reply:</b> {q.admin_message}
                      </div>
                    )}

                    {q.status === "new" && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Dialog open={editing?.id === q.id && editing.status === "approved"} onOpenChange={(o) => !o && setEditing(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => openDialog(q, "approved")}>
                              <MessageSquareReply className="w-4 h-4 mr-1" /> Approve with offer
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Send price offer</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              <div>
                                <Label>Offered price (Rs.)</Label>
                                <Input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
                              </div>
                              <div>
                                <Label>Message to customer</Label>
                                <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Hi! Here's our offer for your custom request..." />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={submit} disabled={submitting}>{submitting ? "Sending..." : "Send offer"}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={editing?.id === q.id && editing.status === "rejected"} onOpenChange={(o) => !o && setEditing(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => openDialog(q, "rejected")}>Decline</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Decline quote</DialogTitle></DialogHeader>
                            <div>
                              <Label>Reason / message</Label>
                              <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
                            </div>
                            <DialogFooter>
                              <Button onClick={submit} disabled={submitting} variant="destructive">{submitting ? "Sending..." : "Decline"}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminQuotes;
