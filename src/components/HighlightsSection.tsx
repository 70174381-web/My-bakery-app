import { Cake, Clock, Truck, Heart } from "lucide-react";

const highlights = [
  { icon: Cake, title: "Baked Fresh", desc: "Every order made from scratch — never frozen, never mass-produced." },
  { icon: Clock, title: "3-Day Notice", desc: "Cakes need love and time. Order at least 3 days ahead for perfection." },
  { icon: Truck, title: "City Delivery", desc: "We deliver via Bykea riders. Shipping calculated at checkout." },
  { icon: Heart, title: "Made With Love", desc: "Home kitchen, quality ingredients, and a passion for baking." },
];

const HighlightsSection = () => (
  <section className="py-16 bg-vendel-warm">
    <div className="container mx-auto px-4">
      <p className="font-cursive text-vendel-gold text-2xl text-center mb-2">Why Vendel?</p>
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
        What Makes Us Special
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {highlights.map((h) => (
          <div
            key={h.title}
            className="bg-background rounded-xl p-6 text-center shadow-md hover:shadow-xl transition-shadow border border-border"
          >
            <div className="w-14 h-14 rounded-full bg-vendel-gold/15 flex items-center justify-center mx-auto mb-4">
              <h.icon className="h-7 w-7 text-vendel-gold" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{h.title}</h3>
            <p className="font-body text-sm text-muted-foreground">{h.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HighlightsSection;
