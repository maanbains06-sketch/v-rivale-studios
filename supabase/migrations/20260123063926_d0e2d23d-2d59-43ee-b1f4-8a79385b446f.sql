-- Fix giveaway_winners policy - add WITH CHECK for insert/update
DROP POLICY IF EXISTS "Admins can manage winners" ON public.giveaway_winners;
CREATE POLICY "Admins can manage winners"
ON public.giveaway_winners
FOR ALL
USING (
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'moderator'::app_role])
  ))
  OR is_owner(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM staff_members
    WHERE staff_members.user_id = auth.uid()
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text])
  ))
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'moderator'::app_role])
  ))
  OR is_owner(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM staff_members
    WHERE staff_members.user_id = auth.uid()
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text])
  ))
);

-- Fix giveaway_entries policy - add admin update capability
DROP POLICY IF EXISTS "Admins can manage entries" ON public.giveaway_entries;
CREATE POLICY "Admins can manage entries"
ON public.giveaway_entries
FOR ALL
USING (
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'moderator'::app_role])
  ))
  OR is_owner(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM staff_members
    WHERE staff_members.user_id = auth.uid()
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text])
  ))
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'moderator'::app_role])
  ))
  OR is_owner(auth.uid())
  OR (EXISTS (
    SELECT 1 FROM staff_members
    WHERE staff_members.user_id = auth.uid()
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text])
  ))
);

-- Add policy for testimonials update by staff (no user_id in table)
DROP POLICY IF EXISTS "Staff can update testimonials" ON public.testimonials;
CREATE POLICY "Staff can update testimonials"
ON public.testimonials
FOR UPDATE
USING (
  is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
)
WITH CHECK (
  is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- Add policy for testimonials delete by staff
DROP POLICY IF EXISTS "Staff can delete testimonials" ON public.testimonials;
CREATE POLICY "Staff can delete testimonials"
ON public.testimonials
FOR DELETE
USING (
  is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- Add policy for notifications insert (system can insert)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add policy for support messages insert (uses user_id not sender_id)
DROP POLICY IF EXISTS "Anyone can send messages in their chats" ON public.support_messages;
CREATE POLICY "Anyone can send messages in their chats"
ON public.support_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM support_chats
    WHERE support_chats.id = support_messages.chat_id
    AND (support_chats.user_id = auth.uid() OR support_chats.assigned_to = auth.uid())
  )
);

-- Fix gallery_submissions delete policy
DROP POLICY IF EXISTS "Staff can delete submissions" ON public.gallery_submissions;
CREATE POLICY "Staff can delete submissions"
ON public.gallery_submissions
FOR DELETE
USING (
  auth.uid() = user_id
  OR is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- Fix creator_applications to allow staff to view all
DROP POLICY IF EXISTS "Staff can view all creator applications" ON public.creator_applications;
CREATE POLICY "Staff can view all creator applications"
ON public.creator_applications
FOR SELECT
USING (
  is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members
    WHERE staff_members.user_id = auth.uid()
    AND staff_members.is_active = true
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'developer'::text])
  )
);

-- Fix creator_applications update policy to include staff
DROP POLICY IF EXISTS "Staff can update creator applications" ON public.creator_applications;
CREATE POLICY "Staff can update creator applications"
ON public.creator_applications
FOR UPDATE
USING (
  is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members
    WHERE staff_members.user_id = auth.uid()
    AND staff_members.is_active = true
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'developer'::text])
  )
)
WITH CHECK (
  is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members
    WHERE staff_members.user_id = auth.uid()
    AND staff_members.is_active = true
    AND staff_members.role_type = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'developer'::text])
  )
);