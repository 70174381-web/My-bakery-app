import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, UserPlus } from "lucide-react";

const AdminLogin = ({ mode = "login" }: { mode?: "login" | "signup" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUpAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSignup = mode === "signup";

  useEffect(() => {
    const saved = localStorage.getItem("vendel_admin_email");
    if (saved) setEmail(saved);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    const { error } = isSignup ? await signUpAdmin(email.trim(), password) : await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      toast({ title: isSignup ? "Signup failed" : "Login failed", description: error.message, variant: "destructive" });
    } else {
      if (remember) localStorage.setItem("vendel_admin_email", email.trim());
      else localStorage.removeItem("vendel_admin_email");
      toast({
        title: isSignup ? "Admin signup started" : "Signed in",
        description: isSignup ? "Check your email if verification is required, then sign in." : "Welcome back.",
      });
      navigate(isSignup ? "/admin/onboarding" : "/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {isSignup ? <UserPlus className="w-6 h-6 text-primary" /> : <Lock className="w-6 h-6 text-primary" />}
          </div>
            <CardTitle className="font-heading text-2xl">{isSignup ? "Admin Signup" : "Admin Login"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Create the first secure bakery admin account" : "Vendel Bakes — kitchen access only"}
            </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vendelbakes.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Remember my email on this device
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (isSignup ? "Creating account…" : "Signing in…") : isSignup ? "Create Admin Account" : "Sign In"}
            </Button>
            {isSignup && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                The first verified account can claim admin access. Later admins must be granted access by an existing admin.
              </p>
            )}
            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? "Already have admin access?" : "Need to set up admin access?"}{" "}
              <Link className="font-medium text-primary hover:underline" to={isSignup ? "/admin/login" : "/admin/signup"}>
                {isSignup ? "Sign in" : "Sign up"}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
