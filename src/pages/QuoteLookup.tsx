import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

interface QuoteRow {
  id: string;
  customer_name: string;
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

const contactSchema = z.string().trim().min(3, "Enter a valid phone or email").max(120);

const statusInfo = (s: string) => {
  if (s === "approved") return { label: "Approved", cls: "bg-green-100 text-green-900 border-green-300" };
  if (s === "rejected") return { label: "Declined", cls: "bg-red-100 text-red-900 border-red-300" };
  return { label: "New — awaiting response", cls: "bg-yellow-100 text-yellow-900 border-yellow-300" };
};

const QuoteLookup = () => {
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QuoteRow[] | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(contact);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("lookup_custom_quotes", { _contact: parsed.data });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResults((data as QuoteRow[]) ?? []);
  };

  return (
    <div className="min-h-screen flex flex-col bg-vendel-cream">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="text-center mb-8">
          <Sparkles className="h-8 w-8 mx-auto text-vendel-rose mb-2" />
          <h1 className="font-heading text-3xl md:text-4xl text-vendel-charcoal">Check your custom quote</h1>
          <p className="text-vendel-charcoal/60 text-sm mt-1">Enter the phone or email you used to submit your request.</p>
        </div>

        <Card className="border-vendel-charcoal/15">
          <CardContent className="p-6">
            <form onSubmit={search} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="contact" className="sr-only">Phone or email</Label>
                <Input id="contact" placeholder="Phone or email" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="bg-vendel-charcoal hover:bg-vendel-charcoal/90 text-vendel-cream">
                <Search className="w-4 h-4 mr-2" /> {loading ? "Searching..." : "Find quotes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {results !== null && (
          <div className="mt-6 space-y-4">
            {results.length === 0 ? (
              <p className="text-center text-vendel-charcoal/60 py-8">
                No quotes found for that contact. Double-check the spelling.
              </p>
            ) : (
              results.map((q) => {
                const info = statusInfo(q.status);
                return (
                  <Card key={q.id} className="border-vendel-charcoal/15">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div>
                          <p className="font-heading text-lg text-vendel-charcoal capitalize">{q.request_type.replace("_", " ")}</p>
                          <p className="text-xs text-vendel-charcoal/50">Submitted {new Date(q.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className={info.cls}>{info.label}</Badge>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-vendel-charcoal/80">
                        {q.occasion && <span><b>Occasion:</b> {q.occasion}</span>}
                        {q.servings && <span><b>Servings:</b> {q.servings}</span>}
                        {q.needed_by && <span><b>Needed by:</b> {q.needed_by}</span>}
                        {q.budget && <span><b>Budget:</b> {q.budget}</span>}
                      </div>

                      {q.status === "approved" && q.offered_price && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-green-900">
                          <p className="text-sm">Our offer</p>
                          <p className="font-heading text-2xl">Rs. {Number(q.offered_price).toLocaleString()}</p>
                        </div>
                      )}

                      {q.admin_message && (
                        <div className="border-l-2 border-vendel-rose pl-3 text-sm text-vendel-charcoal/80 italic">
                          "{q.admin_message}"
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default QuoteLookup;
