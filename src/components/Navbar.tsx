import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vendel_logo.png";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Our Story", to: "/#story" },
  { label: "Reviews", to: "/#reviews" },
  { label: "Track Order", to: "/track" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Vendel Bakes" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-cursive text-2xl text-vendel-gold">Vendel Bakes</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-sm font-body font-medium text-foreground/80 hover:text-vendel-gold transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative text-foreground hover:text-vendel-gold">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block text-sm font-body font-medium text-foreground/80 hover:text-vendel-gold py-2"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/cart" onClick={() => setOpen(false)}>
            <Button variant="outline" size="sm" className="w-full mt-2 border-vendel-gold text-vendel-gold">
              <ShoppingCart className="h-4 w-4 mr-2" /> Cart
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
