-- Grant SELECT permission on staff_members_public view to authenticated and anonymous users
GRANT SELECT ON public.staff_members_public TO anon;
GRANT SELECT ON public.staff_members_public TO authenticated;