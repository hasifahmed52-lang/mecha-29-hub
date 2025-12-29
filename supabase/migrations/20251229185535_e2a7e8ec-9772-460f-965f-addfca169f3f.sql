-- Add RLS policies for admin_users table (only security definer functions access it)
CREATE POLICY "No direct access to admin_users" 
ON public.admin_users 
FOR ALL 
USING (false);

-- Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());