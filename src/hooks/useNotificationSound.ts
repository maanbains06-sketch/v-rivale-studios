import { useCallback, useRef, useEffect } from "react";

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef(true);

  useEffect(() => {
    // Check if sound is enabled in localStorage
    const soundEnabled = localStorage.getItem("notification_sound_enabled");
    isEnabledRef.current = soundEnabled !== "false";
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!isEnabledRef.current) return;

    try {
      // Create audio context on first play (required for autoplay policy)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      // Create a pleasant notification sound using Web Audio API
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Pleasant bell-like sound
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6
      oscillator.frequency.setValueAtTime(1760, ctx.currentTime + 0.2); // A6
      
      oscillator.type = "sine";
      
      // Quick fade in and out for a pleasant sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, []);

  const toggleSound = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    localStorage.setItem("notification_sound_enabled", enabled.toString());
  }, []);

  const isSoundEnabled = useCallback(() => {
    return isEnabledRef.current;
  }, []);

  return { playNotificationSound, toggleSound, isSoundEnabled };
};
