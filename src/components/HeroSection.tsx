import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-primary">
    {/* Warm gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-vendel-brown-dark/95 via-primary/90 to-vendel-brown/80" />

    {/* Decorative elements */}
    <div className="absolute top-20 right-10 w-72 h-72 bg-vendel-gold/10 rounded-full blur-3xl" />
    <div className="absolute bottom-10 left-10 w-96 h-96 bg-vendel-rose/5 rounded-full blur-3xl" />

    <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
      <p className="font-cursive text-vendel-gold text-4xl md:text-5xl mb-4 animate-fade-in">
        From a coder's oven to you
      </p>
      <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-vendel-cream leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        Vendel Bakes
      </h1>
      <p className="font-body text-vendel-cream/80 text-lg md:text-xl max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Artisan cakes, cookies & treats — handcrafted fresh for every occasion. Order online, delivered to your door.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
        <Link to="/shop">
          <Button size="lg" className="bg-vendel-gold text-accent-foreground hover:bg-vendel-gold/90 font-body font-bold px-8 py-6 text-lg rounded-full shadow-lg">
            Browse Menu
          </Button>
        </Link>
        <a href="#story">
          <Button variant="outline" size="lg" className="border-vendel-gold/40 text-vendel-gold hover:bg-vendel-gold/10 font-body px-8 py-6 text-lg rounded-full">
            Our Story
          </Button>
        </a>
      </div>
    </div>
  </section>
);

export default HeroSection;
