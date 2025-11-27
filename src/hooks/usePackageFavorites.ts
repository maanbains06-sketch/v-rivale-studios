import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePackageFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_package_favorites')
        .select('package_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(new Set(data?.map(f => f.package_id) || []));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (packageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to save favorites',
          variant: 'destructive',
        });
        return;
      }

      const isFavorite = favorites.has(packageId);

      if (isFavorite) {
        const { error } = await supabase
          .from('user_package_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('package_id', packageId);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(packageId);
          return newSet;
        });

        toast({
          title: 'Removed from favorites',
          description: 'Package removed from your favorites',
        });
      } else {
        const { error } = await supabase
          .from('user_package_favorites')
          .insert({
            user_id: user.id,
            package_id: packageId,
          });

        if (error) throw error;

        setFavorites(prev => new Set(prev).add(packageId));

        toast({
          title: 'Added to favorites',
          description: 'Package saved to your favorites',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites',
        variant: 'destructive',
      });
    }
  };

  const isFavorite = (packageId: string) => favorites.has(packageId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
  };
};
