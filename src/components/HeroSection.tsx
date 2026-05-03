import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vendel_logo.png";

const HeroSection = () => (
  <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-gradient-hero">
    {/* Soft glow accents */}
    <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-vendel-rose/30 blur-3xl" />
    <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-vendel-rose/20 blur-3xl" />

    {/* Subtle decorative lines */}
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <div className="absolute top-20 left-10 w-[1px] h-64 bg-primary-foreground rotate-[30deg]" />
      <div className="absolute bottom-20 right-20 w-[1px] h-48 bg-primary-foreground rotate-[-20deg]" />
      <div className="absolute top-40 right-1/3 w-[1px] h-56 bg-primary-foreground rotate-[50deg]" />
    </div>

    <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
      <img
        src={logo}
        alt="Vendel Bakes"
        className="h-32 w-32 md:h-40 md:w-40 mx-auto mb-8 rounded-full object-cover animate-fade-in shadow-2xl ring-4 ring-primary-foreground/20"
      />

      <p className="font-cursive text-vendel-rose-light text-3xl md:text-5xl mb-3 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        From a coder&apos;s oven to you
      </p>

      <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-primary-foreground leading-[1.05] mb-5 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        Vendel <span className="italic text-vendel-rose-light">Bakes</span>
      </h1>

      <div className="w-20 h-[1px] bg-primary-foreground/40 mx-auto mb-5 animate-fade-in" style={{ animationDelay: "0.4s" }} />

      <p className="font-body text-primary-foreground/80 text-base md:text-lg max-w-xl mx-auto mb-10 tracking-wide animate-fade-in" style={{ animationDelay: "0.5s" }}>
        Artisan brownies, cakes &amp; baked goods — handcrafted with love and delivered fresh to your doorstep.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.65s" }}>
        <Link to="/shop">
          <Button size="lg" className="bg-primary-foreground text-vendel-charcoal-dark hover:bg-primary-foreground/90 font-body font-semibold px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5">
            Browse the Menu
          </Button>
        </Link>
        <Link to="/track">
          <Button variant="outline" size="lg" className="border-primary-foreground/50 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-body px-10 py-6 text-lg rounded-full backdrop-blur-sm">
            Track Your Order
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

export default HeroSection;