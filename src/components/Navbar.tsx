import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import logo from "@/assets/vendel_logo.png";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Customize", to: "/customize" },
  { label: "Track Order", to: "/order-status" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Vendel Bakes" className="h-10 w-10 rounded-full object-cover ring-2 ring-vendel-rose/30" />
          <span className="font-heading text-xl font-semibold text-foreground tracking-wide">Vendel Bakes</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-sm font-body font-medium text-foreground/70 hover:text-vendel-rose transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/checkout">
            <Button variant="ghost" size="icon" className="relative text-foreground hover:text-vendel-rose">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
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
              className="block text-sm font-body font-medium text-foreground/70 hover:text-vendel-rose py-2"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/checkout" onClick={() => setOpen(false)}>
            <Button variant="outline" size="sm" className="w-full mt-2 border-vendel-rose text-vendel-charcoal">
              <ShoppingCart className="h-4 w-4 mr-2" /> Cart {totalItems > 0 && `(${totalItems})`}
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;