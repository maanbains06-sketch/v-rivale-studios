-- Fix ambiguous user_id column reference in support_chats RLS policies
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view own chats" ON public.support_chats;
DROP POLICY IF EXISTS "Staff can view assigned or unassigned chats" ON public.support_chats;
DROP POLICY IF EXISTS "Users can create own chats" ON public.support_chats;
DROP POLICY IF EXISTS "Staff can update assigned chats" ON public.support_chats;

-- Recreate policies with table-qualified column references to avoid ambiguity
-- Policy for users to view their own chats
CREATE POLICY "Users can view own chats" ON public.support_chats
  FOR SELECT
  USING (
    auth.uid() = support_chats.user_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

-- Policy for users to create their own chats
CREATE POLICY "Users can create own chats" ON public.support_chats
  FOR INSERT
  WITH CHECK (auth.uid() = support_chats.user_id);

-- Policy for users and staff to update chats
CREATE POLICY "Users and staff can update chats" ON public.support_chats
  FOR UPDATE
  USING (
    auth.uid() = support_chats.user_id
    OR auth.uid() = support_chats.assigned_to
    OR is_owner(auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  );