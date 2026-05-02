REVOKE EXECUTE ON FUNCTION public.filter_review_spam() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role and claim_admin_role intentionally remain callable by authenticated users (RLS + claim flow).
