import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, LayoutDashboard, MessageSquareReply, Star, LogIn, UserPlus, ArrowLeft } from "lucide-react";

const AdminPortal = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const tiles = [
    { to: "/admin/dashboard", icon: LayoutDashboard, title: "Dashboard", desc: "Manage products, orders & variants" },
    { to: "/admin/quotes", icon: MessageSquareReply, title: "Custom Quotes", desc: "Respond to customization requests" },
    { to: "/admin/reviews", icon: Star, title: "Reviews", desc: "Approve or reject customer reviews" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-vendel-cream via-background to-vendel-gold/10 flex flex-col">
      {/* Slim admin header — no customer Navbar */}
      <header className="border-b border-vendel-gold/20 bg-background/80 backdrop-blur">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-vendel-gold" />
            <span className="font-heading text-lg">Vendel Bakes · Admin</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" /> Customer site</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-12">
        <div className="text-center mb-10">
          <p className="font-cursive text-vendel-gold text-2xl mb-2">Behind the counter</p>
          <h1 className="font-heading text-4xl md:text-5xl">Admin Portal</h1>
          <p className="text-muted-foreground mt-3">
            Manage your bakery — products, orders, custom quotes, and reviews.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : !user ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-muted-foreground">Please sign in to access admin tools.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/admin/login")}>
                  <LogIn className="w-4 h-4 mr-1.5" /> Admin Login
                </Button>
                <Button variant="outline" onClick={() => navigate("/admin/signup")}>
                  <UserPlus className="w-4 h-4 mr-1.5" /> Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !isAdmin ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center space-y-3">
              <p>You're signed in but not yet an admin.</p>
              <Button onClick={() => navigate("/admin/onboarding")}>Claim admin access</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map(({ to, icon: Icon, title, desc }) => (
              <Link key={to} to={to} className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-0.5 border-vendel-gold/20">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-vendel-gold/15 flex items-center justify-center mb-4 group-hover:bg-vendel-gold/25 transition-colors">
                      <Icon className="w-6 h-6 text-vendel-gold" />
                    </div>
                    <h3 className="font-heading text-xl mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-vendel-gold/20 py-4 text-center text-xs text-muted-foreground">
        Admin area · Customer-facing pages live at <Link to="/" className="underline">vendelbakes.com</Link>
      </footer>
    </div>
  );
};

export default AdminPortal;
