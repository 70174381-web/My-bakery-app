import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Cake, Gift, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Customize = () => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    type: "cake",
    occasion: "",
    servings: "",
    date: "",
    budget: "",
    details: "",
  });

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.details) {
      toast.error("Please fill in your name, contact and details.");
      return;
    }
    setSubmitting(true);
    try {
      const message = `CUSTOM ${form.type.toUpperCase()} REQUEST
Occasion: ${form.occasion || "—"}
Servings: ${form.servings || "—"}
Needed by: ${form.date || "—"}
Budget: ${form.budget || "—"}
Details: ${form.details}`;
      const { error } = await supabase.from("custom_quotes").insert({
        customer_name: form.name,
        contact: form.contact,
        request_type: form.type,
        occasion: form.occasion || null,
        servings: form.servings ? Number(form.servings) : null,
        needed_by: form.date || null,
        budget: form.budget || null,
        details: message,
      });
      if (error) throw error;
      toast.success("Your custom request has been sent! We'll reach out shortly. 🍰");
      setForm({ name: "", contact: "", type: "cake", occasion: "", servings: "", date: "", budget: "", details: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-vendel-cream">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-hero py-20 px-4 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-vendel-rose/30 blur-3xl" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <Sparkles className="h-10 w-10 mx-auto text-vendel-rose-light mb-3" />
            <p className="font-cursive text-vendel-rose-light text-3xl md:text-4xl mb-2">Made just for you</p>
            <h1 className="font-heading text-4xl md:text-6xl text-primary-foreground mb-4">
              Customize your <span className="italic text-vendel-rose-light">order</span>
            </h1>
            <p className="font-body text-primary-foreground/80 text-base md:text-lg max-w-xl mx-auto">
              Dream cake, themed deal box, or a one-of-a-kind treat — tell us what you have in mind and we'll bake it to life.
            </p>
          </div>
        </section>

        {/* Options */}
        <section className="container mx-auto px-4 -mt-12 grid md:grid-cols-3 gap-4 max-w-4xl relative z-10">
          {[
            { icon: Cake, title: "Custom Cake", desc: "Flavor, design & message — your way." },
            { icon: Gift, title: "Deal Box", desc: "Curated brownie & treat boxes." },
            { icon: MessageCircle, title: "Special Request", desc: "Anything else? Just ask." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-vendel-rose/20 shadow-lg">
              <CardContent className="p-5 text-center">
                <Icon className="h-8 w-8 mx-auto text-vendel-rose mb-2" />
                <h3 className="font-heading text-lg text-vendel-charcoal mb-1">{title}</h3>
                <p className="text-sm text-vendel-charcoal/60">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Quote form */}
        <section className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="border-vendel-charcoal/15 shadow-xl">
            <CardContent className="p-6 md:p-8">
              <h2 className="font-heading text-2xl md:text-3xl text-vendel-charcoal mb-1">Request a quote</h2>
              <p className="text-sm text-vendel-charcoal/60 mb-6">We'll get back to you within 24 hours with pricing & availability.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Your name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="contact">Phone / Email *</Label>
                    <Input id="contact" value={form.contact} onChange={(e) => update("contact", e.target.value)} required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>What would you like?</Label>
                    <Select value={form.type} onValueChange={(v) => update("type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cake">Custom Cake</SelectItem>
                        <SelectItem value="deal_box">Deal Box</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="occasion">Occasion</Label>
                    <Input id="occasion" placeholder="Birthday, wedding..." value={form.occasion} onChange={(e) => update("occasion", e.target.value)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="servings">Servings</Label>
                    <Input id="servings" type="number" min="1" value={form.servings} onChange={(e) => update("servings", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="date">Needed by</Label>
                    <Input id="date" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget (Rs.)</Label>
                    <Input id="budget" placeholder="e.g. 5000" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="details">Tell us your idea *</Label>
                  <Textarea
                    id="details"
                    rows={5}
                    placeholder="Flavors, theme, colors, dietary needs, message on cake..."
                    value={form.details}
                    onChange={(e) => update("details", e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} size="lg" className="w-full bg-vendel-rose hover:bg-vendel-rose/90 text-primary-foreground font-body rounded-full shadow-lg">
                  {submitting ? "Sending..." : "Send my request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Customize;
