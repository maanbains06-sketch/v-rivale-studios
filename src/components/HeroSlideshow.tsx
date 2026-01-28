import { useState, useEffect, memo, useRef, useCallback } from "react";
import { useActiveTheme } from "@/hooks/useActiveTheme";

// Import only 8 essential slideshow images for better performance
import cityNight from "@/assets/slideshow/city-night.jpg";
import policeChase from "@/assets/slideshow/police-chase.jpg";
import beachSunset from "@/assets/slideshow/beach-sunset.jpg";
import gangTerritory from "@/assets/slideshow/gang-territory.jpg";
import nightclub from "@/assets/slideshow/nightclub.jpg";
import downtown from "@/assets/slideshow/downtown.jpg";
import carMeet from "@/assets/slideshow/car-meet.jpg";
import highwaySunset from "@/assets/slideshow/highway-sunset.jpg";

// Default slideshow images
const DEFAULT_SLIDESHOW_IMAGES = [
  cityNight,
  policeChase,
  beachSunset,
  gangTerritory,
  nightclub,
  downtown,
  carMeet,
  highwaySunset,
];

// Theme-specific home header image imports
const themeHomeImages: Record<string, () => Promise<{ default: string }>> = {
  winter: () => import('@/assets/themes/winter/header-home.jpg'),
  christmas: () => import('@/assets/themes/christmas/header-home.jpg'),
  halloween: () => import('@/assets/themes/halloween/header-home.jpg'),
  diwali: () => import('@/assets/themes/diwali/header-home.jpg'),
  holi: () => import('@/assets/themes/holi/header-home.jpg'),
  new_year: () => import('@/assets/themes/new_year/header-home.jpg'),
  birthday: () => import('@/assets/themes/birthday/header-home.jpg'),
};

// Adaptive slide duration based on device
const getOptimalDuration = () => {
  if (typeof window === 'undefined') return 6000;
  // Slower on mobile for battery savings
  return window.innerWidth < 768 ? 8000 : 5000;
};

const HeroSlideshow = memo(() => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFirst, setShowFirst] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [themedImage, setThemedImage] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const preloadedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { activeTheme, loading: themeLoading } = useActiveTheme();

  // Load themed home image when theme changes
  useEffect(() => {
    const loadThemedImage = async () => {
      if (activeTheme === 'default' || themeLoading) {
        setThemedImage(null);
        return;
      }

      const importFn = themeHomeImages[activeTheme];
      if (!importFn) {
        setThemedImage(null);
        return;
      }

      try {
        const module = await importFn();
        setThemedImage(module.default);
      } catch (error) {
        console.warn(`Failed to load themed home image for ${activeTheme}:`, error);
        setThemedImage(null);
      }
    };

    loadThemedImage();
  }, [activeTheme, themeLoading]);

  // Pause slideshow when not visible (tab hidden or scrolled away)
  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Intersection observer for scroll visibility
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && document.visibilityState === 'visible');
      },
      { threshold: 0.1 }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Lazy preload images after initial render
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    
    // Delay preload to not block initial render - use requestIdleCallback if available
    const preload = () => {
      DEFAULT_SLIDESHOW_IMAGES.slice(2).forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload, { timeout: 3000 });
    } else {
      setTimeout(preload, 2000);
    }
  }, []);

  // Slideshow timer - only runs when visible and NOT using themed image
  useEffect(() => {
    // If we have a themed image, don't run the slideshow
    if (themedImage) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!isVisible) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    const duration = getOptimalDuration();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DEFAULT_SLIDESHOW_IMAGES.length);
      setShowFirst((prev) => !prev);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isVisible, themedImage]);

  // If themed image is active, show only that
  if (themedImage) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat gpu-accelerated"
          style={{
            backgroundImage: `url(${themedImage})`,
          }}
          aria-hidden="true"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-background/25" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/50" />
      </div>
    );
  }

  // Calculate which image goes on which layer
  const currentImage = DEFAULT_SLIDESHOW_IMAGES[activeIndex];
  const prevImage = DEFAULT_SLIDESHOW_IMAGES[(activeIndex - 1 + DEFAULT_SLIDESHOW_IMAGES.length) % DEFAULT_SLIDESHOW_IMAGES.length];

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden">
      {/* Layer 1 - GPU accelerated */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat gpu-accelerated"
        style={{
          backgroundImage: `url(${showFirst ? currentImage : prevImage})`,
          opacity: showFirst ? 1 : 0,
          transition: "opacity 1s ease-in-out",
        }}
        aria-hidden="true"
      />
      
      {/* Layer 2 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat gpu-accelerated"
        style={{
          backgroundImage: `url(${showFirst ? prevImage : currentImage})`,
          opacity: showFirst ? 0 : 1,
          transition: "opacity 1s ease-in-out",
        }}
        aria-hidden="true"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-background/25" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/50" />
    </div>
  );
});

HeroSlideshow.displayName = "HeroSlideshow";

export default HeroSlideshow;
