import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileCustomization {
  username_color: string | null;
  equipped_badge_id: string | null;
  equipped_frame_id: string | null;
  equipped_bio_effect: string | null;
  badge_emoji: string | null;
  badge_animated: boolean;
  frame_color: string | null;
}

const DEFAULT_CUSTOMIZATION: ProfileCustomization = {
  username_color: null,
  equipped_badge_id: null,
  equipped_frame_id: null,
  equipped_bio_effect: null,
  badge_emoji: null,
  badge_animated: false,
  frame_color: null,
};

// Cache to avoid repeated fetches
const customizationCache = new Map<string, ProfileCustomization>();

export const useProfileCustomization = (userId?: string) => {
  const [customization, setCustomization] = useState<ProfileCustomization>(DEFAULT_CUSTOMIZATION);
  const [loading, setLoading] = useState(false);

  const fetchCustomization = useCallback(async (uid: string) => {
    if (customizationCache.has(uid)) {
      setCustomization(customizationCache.get(uid)!);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("user_profile_customization")
        .select("username_color, equipped_badge_id, equipped_frame_id, equipped_bio_effect")
        .eq("user_id", uid)
        .maybeSingle();

      if (data) {
        // Fetch badge details if equipped
        let badge_emoji: string | null = null;
        let badge_animated = false;
        let frame_color: string | null = null;

        if (data.equipped_badge_id) {
          const { data: badgeItem } = await supabase
            .from("shop_items")
            .select("item_data, item_type")
            .eq("id", data.equipped_badge_id)
            .maybeSingle();
          if (badgeItem) {
            const itemData = badgeItem.item_data as Record<string, any> | null;
            badge_emoji = itemData?.emoji || null;
            badge_animated = badgeItem.item_type === "animated_badge";
          }
        }

        if (data.equipped_frame_id) {
          const { data: frameItem } = await supabase
            .from("shop_items")
            .select("item_data")
            .eq("id", data.equipped_frame_id)
            .maybeSingle();
          if (frameItem) {
            const itemData = frameItem.item_data as Record<string, any> | null;
            frame_color = itemData?.color || null;
          }
        }

        const result: ProfileCustomization = {
          username_color: data.username_color,
          equipped_badge_id: data.equipped_badge_id,
          equipped_frame_id: data.equipped_frame_id,
          equipped_bio_effect: data.equipped_bio_effect,
          badge_emoji,
          badge_animated,
          frame_color,
        };
        customizationCache.set(uid, result);
        setCustomization(result);
      }
    } catch (e) {
      console.error("Failed to fetch profile customization:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCustomization(userId);
    }
  }, [userId, fetchCustomization]);

  return { customization, loading };
};

// Batch fetch for leaderboard/list views
export const fetchBatchCustomizations = async (userIds: string[]): Promise<Map<string, ProfileCustomization>> => {
  const result = new Map<string, ProfileCustomization>();
  const toFetch = userIds.filter(id => !customizationCache.has(id));
  
  // Return cached ones
  userIds.forEach(id => {
    if (customizationCache.has(id)) result.set(id, customizationCache.get(id)!);
  });

  if (toFetch.length === 0) return result;

  const { data } = await supabase
    .from("user_profile_customization")
    .select("user_id, username_color, equipped_badge_id, equipped_frame_id, equipped_bio_effect")
    .in("user_id", toFetch);

  if (data) {
    for (const d of data) {
      const c: ProfileCustomization = {
        username_color: d.username_color,
        equipped_badge_id: d.equipped_badge_id,
        equipped_frame_id: d.equipped_frame_id,
        equipped_bio_effect: d.equipped_bio_effect,
        badge_emoji: null,
        badge_animated: false,
        frame_color: null,
      };
      customizationCache.set(d.user_id, c);
      result.set(d.user_id, c);
    }
  }

  return result;
};

// Clear cache for a user (e.g., after equipping an item)
export const clearCustomizationCache = (userId?: string) => {
  if (userId) customizationCache.delete(userId);
  else customizationCache.clear();
};
