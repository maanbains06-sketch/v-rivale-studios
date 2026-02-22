-- Allow owner to delete mini game scores (for leaderboard resets)
CREATE POLICY "Owner can delete mini game scores"
ON public.mini_game_scores FOR DELETE
USING (public.is_owner(auth.uid()));