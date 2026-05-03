import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  MessageSquare,
  Loader2,
  ShieldCheck,
  ThumbsUp,
  Quote,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { z } from "zod";

const reviewSchema = z.object({
  reviewer_name: z.string().trim().min(2, "Please enter your name").max(80, "Name too long"),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Review must be at least 10 characters").max(2000, "Review too long"),
});

interface Props {
  productId: string;
}

type SortKey = "newest" | "highest" | "helpful";
const PAGE_SIZE = 4;
const HELPFUL_KEY = "vendel_helpful_reviews";
const MY_REVIEWS_KEY = "vendel_my_reviews";

const StarRow = ({
  value,
  size = "md",
  onChange,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  onChange?: (n: number) => void;
}) => {
  const dim = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <Star
            key={i}
            className={`${dim} ${filled ? "fill-vendel-gold text-vendel-gold" : "text-muted-foreground/30"} ${onChange ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={onChange ? () => onChange(i + 1) : undefined}
            aria-label={`${i + 1} star`}
          />
        );
      })}
    </div>
  );
};

const getHelpfulSet = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(HELPFUL_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
};

type LocalReview = {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  title?: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
};

const getLocalMyReviews = (): LocalReview[] => {
  try {
    return JSON.parse(localStorage.getItem(MY_REVIEWS_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const saveLocalMyReview = (r: LocalReview) => {
  const list = getLocalMyReviews();
  // dedupe by id, keep most recent 30
  const next = [r, ...list.filter((x) => x.id !== r.id)].slice(0, 30);
  try {
    localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(next));
  } catch {}
};

const ProductReviews = ({ productId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [helpfulIds, setHelpfulIds] = useState<Set<string>>(() => getHelpfulSet());
  const [myReviews, setMyReviews] = useState<LocalReview[]>(() =>
    getLocalMyReviews().filter((r) => r.product_id === productId)
  );

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, reviewer_name, rating, title, body, created_at, helpful_count")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sorted = useMemo(() => {
    if (!reviews) return [];
    const list = [...reviews];
    if (sort === "highest") list.sort((a, b) => b.rating - a.rating || +new Date(b.created_at) - +new Date(a.created_at));
    else if (sort === "helpful") list.sort((a, b) => (b.helpful_count ?? 0) - (a.helpful_count ?? 0) || +new Date(b.created_at) - +new Date(a.created_at));
    else list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return list;
  }, [reviews, sort]);

  // Featured = highest helpful_count (fallback to highest rating)
  const featured = useMemo(() => {
    if (!reviews || reviews.length < 2) return null;
    const ranked = [...reviews].sort(
      (a, b) =>
        (b.helpful_count ?? 0) - (a.helpful_count ?? 0) ||
        b.rating - a.rating ||
        +new Date(b.created_at) - +new Date(a.created_at)
    );
    const top = ranked[0];
    if ((top.helpful_count ?? 0) === 0 && top.rating < 4) return null;
    return top;
  }, [reviews]);

  const featuredId = featured?.id;
  // Exclude featured from listing to avoid duplication
  const sortedFiltered = useMemo(
    () => (featuredId ? sorted.filter((r) => r.id !== featuredId) : sorted),
    [sorted, featuredId]
  );

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const ratingCount = reviews?.length ?? 0;
  const avg = ratingCount > 0
    ? Math.round((reviews!.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10
    : null;

  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // 1..5
    (reviews ?? []).forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) buckets[r.rating - 1]++;
    });
    return buckets;
  }, [reviews]);

  const helpfulMutation = useMutation({
    mutationFn: async (review: { id: string; helpful_count: number }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ helpful_count: (review.helpful_count ?? 0) + 1 })
        .eq("id", review.id);
      if (error) throw error;
    },
    onSuccess: (_d, review) => {
      const next = new Set(helpfulIds);
      next.add(review.id);
      setHelpfulIds(next);
      try { localStorage.setItem(HELPFUL_KEY, JSON.stringify([...next])); } catch {}
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: () => {
      toast({ title: "Couldn't mark helpful", description: "Please try again.", variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: z.infer<typeof reviewSchema>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          product_id: productId,
          user_id: userData.user?.id ?? null,
          reviewer_name: payload.reviewer_name,
          rating: payload.rating,
          title: payload.title || null,
          body: payload.body,
          status: "pending",
        })
        .select("id, status, rejection_reason, created_at, reviewer_name, rating, title, body")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (!data) return;
      const local: LocalReview = {
        id: data.id,
        product_id: productId,
        reviewer_name: data.reviewer_name,
        rating: data.rating,
        title: data.title,
        body: data.body,
        status: (data.status as LocalReview["status"]) ?? "pending",
        rejection_reason: data.rejection_reason,
        created_at: data.created_at,
      };
      saveLocalMyReview(local);
      setMyReviews((prev) => [local, ...prev.filter((x) => x.id !== local.id)]);

      if (data.status === "rejected") {
        toast({
          title: "Review couldn't be posted",
          description: data.rejection_reason ?? "Our spam filter blocked this submission.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Thanks for your review!",
          description: "It will appear publicly once approved by our team.",
        });
        setName("");
        setTitle("");
        setBody("");
        setRating(5);
        setErrors({});
      }
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
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    submitMutation.mutate(parsed.data);
  };

  return (
    <section aria-labelledby="reviews-heading" className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-cursive text-vendel-rose text-xl">What customers say</p>
          <h2 id="reviews-heading" className="font-heading text-3xl md:text-4xl text-foreground">
            Customer Reviews
          </h2>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-vendel-rose" />
          Moderated &amp; spam-filtered
        </p>
      </div>

      {/* Rating summary */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-6 md:p-8 grid md:grid-cols-[auto,1fr] gap-8 items-center">
          <div className="text-center md:text-left md:border-r md:pr-8 md:border-border/60">
            <div className="font-heading text-5xl md:text-6xl text-foreground leading-none">
              {avg !== null ? avg.toFixed(1) : "—"}
            </div>
            <div className="mt-2 flex justify-center md:justify-start">
              <StarRow value={Math.round(avg ?? 0)} size="lg" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
            </p>
          </div>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars - 1];
              const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-muted-foreground tabular-nums">{stars} star</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-vendel-gold transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* My submissions status */}
      {myReviews.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-heading text-sm uppercase tracking-wide text-muted-foreground">
            Your submissions
          </h3>
          <div className="space-y-2">
            {myReviews.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
              >
                {r.status === "approved" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                ) : r.status === "rejected" ? (
                  <XCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                ) : (
                  <Clock3 className="w-4 h-4 mt-0.5 text-vendel-rose shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        r.status === "approved"
                          ? "secondary"
                          : r.status === "rejected"
                            ? "destructive"
                            : "outline"
                      }
                      className="capitalize text-[10px]"
                    >
                      {r.status}
                    </Badge>
                    <StarRow value={r.rating} size="sm" />
                    {r.title && <span className="text-sm font-medium truncate">{r.title}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.body}</p>
                  {r.status === "rejected" && r.rejection_reason && (
                    <p className="text-xs text-destructive mt-1">Reason: {r.rejection_reason}</p>
                  )}
                  {r.status === "pending" && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Awaiting approval — usually within 24 hours.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured review */}
      {featured && (
        <Card className="border-vendel-rose/30 bg-vendel-rose/5 overflow-hidden">
          <CardContent className="p-6 md:p-8 relative">
            <Quote className="absolute top-4 right-4 w-12 h-12 text-vendel-rose/15" />
            <Badge className="bg-vendel-rose text-primary-foreground mb-3">Featured review</Badge>
            <StarRow value={featured.rating} />
            {featured.title && (
              <h3 className="font-heading text-xl md:text-2xl text-foreground mt-3">
                {featured.title}
              </h3>
            )}
            <p className="text-foreground/90 leading-relaxed mt-2 italic">
              &ldquo;{featured.body}&rdquo;
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              — {featured.reviewer_name},{" "}
              {new Date(featured.created_at).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sort + count */}
      {sortedFiltered.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedFiltered.length)} of {sortedFiltered.length}
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort" className="text-xs text-muted-foreground">Sort by</Label>
            <Select value={sort} onValueChange={(v: SortKey) => { setSort(v); setPage(1); }}>
              <SelectTrigger id="sort" className="w-[170px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="highest">Highest rating</SelectItem>
                <SelectItem value="helpful">Most helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : pageItems.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {pageItems.map((r) => {
              const marked = helpfulIds.has(r.id);
              const initial = r.reviewer_name?.charAt(0).toUpperCase() ?? "•";
              return (
                <Card key={r.id} className="border-border/50 hover:border-vendel-rose/40 transition-colors">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vendel-rose/15 text-vendel-rose font-heading text-lg flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.reviewer_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <StarRow value={r.rating} size="sm" />
                    </div>
                    {r.title && <h3 className="font-heading text-base text-foreground">{r.title}</h3>}
                    <p className="text-sm text-foreground/90 leading-relaxed">{r.body}</p>
                    <div className="flex items-center justify-end pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        disabled={marked || helpfulMutation.isPending}
                        onClick={() => helpfulMutation.mutate({ id: r.id, helpful_count: r.helpful_count ?? 0 })}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${marked ? "fill-vendel-gold text-vendel-gold" : ""}`} />
                        Helpful{(r.helpful_count ?? 0) > 0 ? ` · ${r.helpful_count}` : ""}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  const show = n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1;
                  if (!show) {
                    if (n === 2 || n === totalPages - 1) {
                      return <PaginationItem key={n}><PaginationEllipsis /></PaginationItem>;
                    }
                    return null;
                  }
                  return (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={n === currentPage}
                        onClick={(e) => { e.preventDefault(); setPage(n); }}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : !featured ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No reviews yet — be the first to share your thoughts!</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Write review */}
      <Card className="border-border/60 bg-gradient-warm">
        <CardContent className="p-6 md:p-8">
          <div className="mb-5">
            <p className="font-cursive text-vendel-rose text-xl">Share your experience</p>
            <h3 className="font-heading text-2xl text-foreground">Write a review</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reviews appear publicly after approval — usually within 24 hours.
            </p>
          </div>
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
                <StarRow value={rating} onChange={setRating} size="lg" />
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
              Submit for approval
            </Button>
            <p className="text-xs text-muted-foreground">
              Spam-filtered. Limit: 3 reviews per hour, one per product per day.
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default ProductReviews;
