import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck, Users, PackageCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const AdminOnboarding = () => {
  const { user, isAdmin, loading, claimAdminRole } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  const handleClaim = async () => {
    setClaiming(true);
    const { error } = await claimAdminRole();
    setClaiming(false);

    if (error) {
      toast({ title: "Admin setup failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Admin access ready", description: "Your role is active for the bakery dashboard." });
    navigate("/admin");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <p className="font-heading text-sm uppercase tracking-wide text-primary">Vendel Bakes admin setup</p>
          <h1 className="font-heading text-3xl text-foreground">Secure your kitchen access</h1>
          <p className="text-muted-foreground">Review what admin access controls before entering the dashboard.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader>
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle className="font-heading text-lg">First-admin claim</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Only the first eligible account can initialize admin access. Claims are validated by the backend.
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="font-heading text-lg">Role permissions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Admins can manage products, variants, stock status, and orders. Customers only see public shop data.
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <PackageCheck className="h-6 w-6 text-primary" />
              <CardTitle className="font-heading text-lg">Bakery operations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use the dashboard to keep availability, lead times, capacities, and payment confirmations current.
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-xl text-foreground">{isAdmin ? "Admin role already active" : "Finish role setup"}</h2>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "You can continue to the admin dashboard." : "Claim admin access for this account if no admin has been created yet."}
              </p>
            </div>
            <Button onClick={isAdmin ? () => navigate("/admin") : handleClaim} disabled={claiming}>
              {claiming ? "Setting up…" : isAdmin ? "Open Dashboard" : "Claim Admin Role"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminOnboarding;