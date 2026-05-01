import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";

const reviewSchema = z.object({
  reviewer_name: z.string().trim().min(2, "Please enter your name").max(80, "Name too long"),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(5, "Review must be at least 5 characters").max(2000, "Review too long"),
});

interface Props {
  productId: string;
}

const StarRow = ({ value, onChange, size = 5 }: { value: number; onChange?: (n: number) => void; size?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        const cls = `h-${size} w-${size} ${filled ? "fill-vendel-gold text-vendel-gold" : "text-muted-foreground/40"} ${onChange ? "cursor-pointer hover:scale-110 transition-transform" : ""}`;
        return (
          <Star
            key={i}
            className={cls}
            onClick={onChange ? () => onChange(i + 1) : undefined}
            aria-label={`${i + 1} star`}
          />
        );
      })}
    </div>
  );
};

const ProductReviews = ({ productId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, reviewer_name, rating, title, body, created_at")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: z.infer<typeof reviewSchema>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: userData.user?.id ?? null,
        reviewer_name: payload.reviewer_name,
        rating: payload.rating,
        title: payload.title || null,
        body: payload.body,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your review was submitted and will appear after approval.",
      });
      setName("");
      setTitle("");
      setBody("");
      setRating(5);
      setErrors({});
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (e: any) => {
      toast({ title: "Couldn't submit review", description: e.message ?? "Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = reviewSchema.safeParse({ reviewer_name: name, rating, title, body });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    submitMutation.mutate(parsed.data);
  };

  const avg = reviews && reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 id="reviews-heading" className="font-heading text-2xl md:text-3xl text-foreground">
            Customer Reviews
          </h2>
          {avg !== null && (
            <div className="flex items-center gap-2 mt-2">
              <StarRow value={Math.round(avg)} />
              <span className="text-sm text-muted-foreground">
                {avg.toFixed(1)} · {reviews!.length} review{reviews!.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-vendel-rose" />
          Moderated · only approved reviews shown
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <Card key={r.id} className="border-border/50">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <StarRow value={r.rating} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {r.title && <h3 className="font-heading text-base text-foreground">{r.title}</h3>}
                <p className="text-sm text-foreground/90 leading-relaxed">{r.body}</p>
                <p className="text-xs text-muted-foreground pt-1">— {r.reviewer_name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No reviews yet — be the first to share your thoughts!</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-heading text-xl text-foreground mb-4">Leave a review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rev-name">Your name *</Label>
                <Input
                  id="rev-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  aria-invalid={!!errors.reviewer_name}
                />
                {errors.reviewer_name && <p className="text-xs text-destructive">{errors.reviewer_name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Rating *</Label>
                <StarRow value={rating} onChange={setRating} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev-title">Title (optional)</Label>
              <Input
                id="rev-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Loved the chocolate cake!"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev-body">Your review *</Label>
              <Textarea
                id="rev-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                rows={4}
                aria-invalid={!!errors.body}
                placeholder="Tell us what you thought…"
              />
              {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
              <p className="text-xs text-muted-foreground">{body.length}/2000</p>
            </div>
            <Button type="submit" disabled={submitMutation.isPending} className="gap-2">
              {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              Submit review
            </Button>
            <p className="text-xs text-muted-foreground">
              Reviews are checked by our team before going live.
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default ProductReviews;
