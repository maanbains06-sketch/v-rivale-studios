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
      
      // Create a louder, more attention-grabbing notification sound
      const oscillator = ctx.createOscillator();
      const oscillator2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const gainNode2 = ctx.createGain();
      const masterGain = ctx.createGain();
      
      oscillator.connect(gainNode);
      oscillator2.connect(gainNode2);
      gainNode.connect(masterGain);
      gainNode2.connect(masterGain);
      masterGain.connect(ctx.destination);
      
      // First tone - higher pitched bell sound
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1600, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(2000, ctx.currentTime + 0.2);
      oscillator.type = "sine";
      
      // Second tone - harmonic for richer sound
      oscillator2.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator2.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
      oscillator2.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
      oscillator2.type = "triangle";
      
      // MUCH LOUDER - increased from 0.3 to 0.8
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      
      gainNode2.gain.setValueAtTime(0, ctx.currentTime);
      gainNode2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
      gainNode2.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.15);
      gainNode2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      
      // Master volume - loud and clear
      masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
      oscillator2.start(ctx.currentTime);
      oscillator2.stop(ctx.currentTime + 0.5);
      
      // Play a second chime for emphasis
      setTimeout(() => {
        if (!audioContextRef.current) return;
        const ctx2 = audioContextRef.current;
        const osc3 = ctx2.createOscillator();
        const gain3 = ctx2.createGain();
        osc3.connect(gain3);
        gain3.connect(ctx2.destination);
        
        osc3.frequency.setValueAtTime(1800, ctx2.currentTime);
        osc3.frequency.setValueAtTime(2200, ctx2.currentTime + 0.1);
        osc3.type = "sine";
        
        gain3.gain.setValueAtTime(0, ctx2.currentTime);
        gain3.gain.linearRampToValueAtTime(0.7, ctx2.currentTime + 0.02);
        gain3.gain.linearRampToValueAtTime(0, ctx2.currentTime + 0.3);
        
        osc3.start(ctx2.currentTime);
        osc3.stop(ctx2.currentTime + 0.3);
      }, 200);
      
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
