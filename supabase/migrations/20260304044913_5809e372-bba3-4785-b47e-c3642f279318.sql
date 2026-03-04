
-- Allow authenticated staff members to update ONLY their signature on contracts where their discord_id matches
CREATE POLICY "Staff can sign their own contracts"
ON public.staff_contracts
FOR UPDATE
TO authenticated
USING (
  staff_discord_id = public.get_user_discord_id()
)
WITH CHECK (
  staff_discord_id = public.get_user_discord_id()
);
