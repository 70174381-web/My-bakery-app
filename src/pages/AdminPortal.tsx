import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, LayoutDashboard, MessageSquareReply, Star, LogIn, UserPlus, ArrowLeft, Package, ShoppingBag, Clock, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminPortal = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["admin-portal-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [products, orders, pendingOrders, reviewsPending, reviewsApproved, quotesNew] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("custom_quotes").select("*", { count: "exact", head: true }).eq("status", "new"),
      ]);
      return {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        reviewsPending: reviewsPending.count ?? 0,
        reviewsApproved: reviewsApproved.count ?? 0,
        quotesNew: quotesNew.count ?? 0,
      };
    },
  });

  const tiles = [
    { to: "/admin/dashboard", icon: LayoutDashboard, title: "Manage Products", desc: "Add, edit, or remove products & variants", badge: stats?.products, badgeLabel: "total" },
    { to: "/admin/quotes", icon: MessageSquareReply, title: "Custom Quotes", desc: "Respond to customization requests", badge: stats?.quotesNew, badgeLabel: "new" },
    { to: "/admin/reviews", icon: Star, title: "Reviews", desc: "Approve or reject customer reviews", badge: stats?.reviewsPending, badgeLabel: "pending" },
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" /> Customer site</Link>
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/admin/login"); }}>
                <LogOut className="w-4 h-4 mr-1.5" /> Sign out
              </Button>
            )}
          </div>
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
          <>
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
              {[
                { icon: Package, label: "Products", value: stats?.products ?? "—", hint: "in catalog" },
                { icon: ShoppingBag, label: "Orders", value: stats?.orders ?? "—", hint: `${stats?.pendingOrders ?? 0} pending` },
                { icon: Star, label: "Reviews", value: stats?.reviewsApproved ?? "—", hint: `${stats?.reviewsPending ?? 0} pending` },
                { icon: Clock, label: "New quotes", value: stats?.quotesNew ?? "—", hint: "awaiting response" },
              ].map(({ icon: Icon, label, value, hint }) => (
                <Card key={label} className="border-vendel-gold/20">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
                      <Icon className="w-4 h-4 text-vendel-gold" />
                    </div>
                    <div className="font-heading text-3xl">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Manage tiles */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tiles.map(({ to, icon: Icon, title, desc, badge, badgeLabel }) => (
                <Link key={to} to={to} className="group">
                  <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-0.5 border-vendel-gold/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-vendel-gold/15 flex items-center justify-center group-hover:bg-vendel-gold/25 transition-colors">
                          <Icon className="w-6 h-6 text-vendel-gold" />
                        </div>
                        {badge != null && Number(badge) > 0 && (
                          <Badge variant="secondary">{badge} {badgeLabel}</Badge>
                        )}
                      </div>
                      <h3 className="font-heading text-xl mb-1">{title}</h3>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-vendel-gold/20 py-4 text-center text-xs text-muted-foreground">
        Admin area · Customer-facing pages live at <Link to="/" className="underline">vendelbakes.com</Link>
      </footer>
    </div>
  );
};

export default AdminPortal;
