-- =====================================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- Restricts sensitive data access to owner only
-- =====================================================

-- 1. UPDATE SUPPORT_MESSAGES RLS POLICIES
-- Only chat owner, assigned staff, or owner can view messages
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.support_messages;
DROP POLICY IF EXISTS "Staff can insert messages" ON public.support_messages;
DROP POLICY IF EXISTS "Staff can update messages" ON public.support_messages;

-- Users can view their own chat messages
CREATE POLICY "Users can view own chat messages" 
ON public.support_messages 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM support_chats WHERE id = support_messages.chat_id
  )
  OR auth.uid() IN (
    SELECT assigned_to FROM support_chats WHERE id = support_messages.chat_id AND assigned_to IS NOT NULL
  )
  OR is_owner(auth.uid())
);

-- Only assigned staff or owner can insert staff messages
CREATE POLICY "Staff can insert messages" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (
  (is_staff = true AND (
    auth.uid() IN (SELECT assigned_to FROM support_chats WHERE id = chat_id AND assigned_to IS NOT NULL)
    OR is_owner(auth.uid())
  ))
);

-- Only assigned staff or owner can update messages
CREATE POLICY "Staff can update messages" 
ON public.support_messages 
FOR UPDATE 
USING (
  auth.uid() IN (SELECT assigned_to FROM support_chats WHERE id = support_messages.chat_id AND assigned_to IS NOT NULL)
  OR is_owner(auth.uid())
);

-- 2. UPDATE ORDERS RLS POLICIES
-- Only owner can view all orders (not all admins/moderators)
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Only owner can view all orders
CREATE POLICY "Owner can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_owner(auth.uid()));

-- Only owner can update orders
CREATE POLICY "Owner can update orders" 
ON public.orders 
FOR UPDATE 
USING (is_owner(auth.uid()));

-- 3. UPDATE STAFF_MEMBERS RLS POLICIES
-- Remove moderator access to full staff_members table (they should use the public view)
DROP POLICY IF EXISTS "Authorized users can view all staff members" ON public.staff_members;

-- Only admins and owner can view full staff member details (including emails)
CREATE POLICY "Admins and owner can view all staff members" 
ON public.staff_members 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR is_owner(auth.uid())
);

-- 4. UPDATE SUPPORT_CHATS RLS POLICIES
-- Restrict support chat access to assigned staff and owner
DROP POLICY IF EXISTS "Staff can view all chats" ON public.support_chats;
DROP POLICY IF EXISTS "Staff can update chats" ON public.support_chats;

-- Staff can only view chats assigned to them or unassigned (for pickup), owner sees all
CREATE POLICY "Staff can view assigned or unassigned chats" 
ON public.support_chats 
FOR SELECT 
USING (
  auth.uid() = user_id
  OR auth.uid() = assigned_to
  OR (assigned_to IS NULL AND has_role(auth.uid(), 'moderator'::app_role))
  OR is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Staff can only update chats they're assigned to
CREATE POLICY "Staff can update assigned chats" 
ON public.support_chats 
FOR UPDATE 
USING (
  auth.uid() = user_id
  OR auth.uid() = assigned_to
  OR is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 5. UPDATE USER_ROLES RLS POLICIES
-- Only owner can manage roles (not just any admin)
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Only owner can manage all roles
CREATE POLICY "Only owner can manage roles" 
ON public.user_roles 
FOR ALL 
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- 6. UPDATE CANNED_RESPONSES - Owner and assigned staff only
DROP POLICY IF EXISTS "Staff can view all canned responses" ON public.canned_responses;
DROP POLICY IF EXISTS "Staff can insert canned responses" ON public.canned_responses;
DROP POLICY IF EXISTS "Staff can update canned responses" ON public.canned_responses;
DROP POLICY IF EXISTS "Staff can delete canned responses" ON public.canned_responses;

CREATE POLICY "Staff can view canned responses" 
ON public.canned_responses 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR is_owner(auth.uid())
);

CREATE POLICY "Owner can manage canned responses" 
ON public.canned_responses 
FOR ALL 
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- 7. RESTRICT SITE_SETTINGS TO AUTHENTICATED USERS
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

-- Only authenticated users can view site settings
CREATE POLICY "Authenticated users can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only owner can manage site settings
CREATE POLICY "Owner can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- 8. UPDATE STAFF_ACTIVITY_LOG - More restrictive
DROP POLICY IF EXISTS "Admins can view all activity" ON public.staff_activity_log;

CREATE POLICY "Owner and admins can view all activity" 
ON public.staff_activity_log 
FOR SELECT 
USING (
  is_owner(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);