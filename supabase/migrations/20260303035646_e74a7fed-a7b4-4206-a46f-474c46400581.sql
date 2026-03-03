
-- Allow all authenticated users to view staff contracts (read-only)
CREATE POLICY "Authenticated users can view staff contracts"
ON public.staff_contracts
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to view creator contracts (read-only)
CREATE POLICY "Authenticated users can view creator contracts"
ON public.creator_contracts
FOR SELECT
TO authenticated
USING (true);
