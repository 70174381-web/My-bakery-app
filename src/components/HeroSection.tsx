import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vendel_logo.png";

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    {/* Split background matching logo */}
    <div className="absolute inset-0 flex">
      <div className="w-1/2 bg-vendel-charcoal-dark" />
      <div className="w-1/2 bg-vendel-rose" />
    </div>

    {/* Subtle decorative lines */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-20 left-10 w-[1px] h-64 bg-primary-foreground rotate-[30deg]" />
      <div className="absolute bottom-20 right-20 w-[1px] h-48 bg-primary-foreground rotate-[-20deg]" />
      <div className="absolute top-40 right-1/3 w-[1px] h-56 bg-primary-foreground rotate-[50deg]" />
    </div>

    <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
      <img src={logo} alt="Vendel Bakes" className="h-40 w-40 mx-auto mb-8 rounded-2xl object-cover animate-fade-in shadow-2xl" />

      <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        Vendel Bakes
      </h1>

      <div className="w-16 h-[1px] bg-primary-foreground/40 mx-auto mb-4 animate-fade-in" style={{ animationDelay: "0.3s" }} />

      <p className="font-body text-primary-foreground/80 text-lg md:text-xl max-w-xl mx-auto mb-10 tracking-wide animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Artisan Brownies &amp; Baked Goods
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
        <Link to="/shop">
          <Button size="lg" className="bg-primary-foreground text-vendel-charcoal-dark hover:bg-primary-foreground/90 font-body font-semibold px-8 py-6 text-lg rounded-full shadow-lg">
            Browse Menu
          </Button>
        </Link>
        <a href="#story">
          <Button variant="outline" size="lg" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 font-body px-8 py-6 text-lg rounded-full">
            Our Story
          </Button>
        </a>
      </div>
    </div>
  </section>
);

export default HeroSection;