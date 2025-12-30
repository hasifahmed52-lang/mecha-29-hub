-- Ensure pgcrypto is available (required for crypt())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate verify_admin_login using explicit casts
CREATE OR REPLACE FUNCTION public.verify_admin_login(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.admin_users
  WHERE username = p_username;

  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN stored_hash = crypt(p_password::text, stored_hash::text);
END;
$$;

-- Ensure assign_admin_role exists
CREATE OR REPLACE FUNCTION public.assign_admin_role(p_user_id uuid, p_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE username = p_username) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;