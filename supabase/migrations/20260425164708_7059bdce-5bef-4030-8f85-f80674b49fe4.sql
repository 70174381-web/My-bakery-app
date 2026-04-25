CREATE OR REPLACE FUNCTION public.claim_admin_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester uuid := auth.uid();
  admin_exists boolean;
BEGIN
  IF requester IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'::public.app_role
  ) INTO admin_exists;

  IF admin_exists AND NOT public.has_role(requester, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin already exists';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (requester, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;