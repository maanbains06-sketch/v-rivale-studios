import { useState, useEffect, memo, useRef } from "react";
import { useActiveTheme, ThemeType } from "@/hooks/useActiveTheme";

// Import default slideshow images
import cityNight from "@/assets/slideshow/city-night.jpg";
import policeChase from "@/assets/slideshow/police-chase.jpg";
import beachSunset from "@/assets/slideshow/beach-sunset.jpg";
import gangTerritory from "@/assets/slideshow/gang-territory.jpg";
import nightclub from "@/assets/slideshow/nightclub.jpg";
import downtown from "@/assets/slideshow/downtown.jpg";
import carMeet from "@/assets/slideshow/car-meet.jpg";
import highwaySunset from "@/assets/slideshow/highway-sunset.jpg";

// Import winter themed slideshow images
import winterSlide1 from "@/assets/themes/winter/slideshow-1.jpg";
import winterSlide2 from "@/assets/themes/winter/slideshow-2.jpg";
import winterSlide3 from "@/assets/themes/winter/slideshow-3.jpg";
import winterSlide4 from "@/assets/themes/winter/slideshow-4.jpg";

// Import christmas themed slideshow images
import christmasSlide1 from "@/assets/themes/christmas/slideshow-1.jpg";
import christmasSlide2 from "@/assets/themes/christmas/slideshow-2.jpg";
import christmasSlide3 from "@/assets/themes/christmas/slideshow-3.jpg";
import christmasSlide4 from "@/assets/themes/christmas/slideshow-4.jpg";

// Import halloween themed slideshow images
import halloweenSlide1 from "@/assets/themes/halloween/slideshow-1.jpg";
import halloweenSlide2 from "@/assets/themes/halloween/slideshow-2.jpg";
import halloweenSlide3 from "@/assets/themes/halloween/slideshow-3.jpg";
import halloweenSlide4 from "@/assets/themes/halloween/slideshow-4.jpg";

// Import diwali themed slideshow images
import diwaliSlide1 from "@/assets/themes/diwali/slideshow-1.jpg";
import diwaliSlide2 from "@/assets/themes/diwali/slideshow-2.jpg";
import diwaliSlide3 from "@/assets/themes/diwali/slideshow-3.jpg";
import diwaliSlide4 from "@/assets/themes/diwali/slideshow-4.jpg";

// Import holi themed slideshow images
import holiSlide1 from "@/assets/themes/holi/slideshow-1.jpg";
import holiSlide2 from "@/assets/themes/holi/slideshow-2.jpg";
import holiSlide3 from "@/assets/themes/holi/slideshow-3.jpg";
import holiSlide4 from "@/assets/themes/holi/slideshow-4.jpg";

// Import new year themed slideshow images
import newYearSlide1 from "@/assets/themes/new_year/slideshow-1.jpg";
import newYearSlide2 from "@/assets/themes/new_year/slideshow-2.jpg";
import newYearSlide3 from "@/assets/themes/new_year/slideshow-3.jpg";
import newYearSlide4 from "@/assets/themes/new_year/slideshow-4.jpg";

// Import birthday themed slideshow images
import birthdaySlide1 from "@/assets/themes/birthday/slideshow-1.jpg";
import birthdaySlide2 from "@/assets/themes/birthday/slideshow-2.jpg";
import birthdaySlide3 from "@/assets/themes/birthday/slideshow-3.jpg";
import birthdaySlide4 from "@/assets/themes/birthday/slideshow-4.jpg";

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

// Theme-specific slideshow images
const THEMED_SLIDESHOW_IMAGES: Record<ThemeType, string[]> = {
  default: DEFAULT_SLIDESHOW_IMAGES,
  winter: [winterSlide1, winterSlide2, winterSlide3, winterSlide4],
  christmas: [christmasSlide1, christmasSlide2, christmasSlide3, christmasSlide4],
  halloween: [halloweenSlide1, halloweenSlide2, halloweenSlide3, halloweenSlide4],
  diwali: [diwaliSlide1, diwaliSlide2, diwaliSlide3, diwaliSlide4],
  holi: [holiSlide1, holiSlide2, holiSlide3, holiSlide4],
  new_year: [newYearSlide1, newYearSlide2, newYearSlide3, newYearSlide4],
  birthday: [birthdaySlide1, birthdaySlide2, birthdaySlide3, birthdaySlide4],
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const preloadedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { activeTheme, loading: themeLoading } = useActiveTheme();

  // Get the correct slideshow images based on theme
  const slideshowImages = THEMED_SLIDESHOW_IMAGES[activeTheme] || DEFAULT_SLIDESHOW_IMAGES;

  // Reset slideshow when theme changes
  useEffect(() => {
    setActiveIndex(0);
    setShowFirst(true);
  }, [activeTheme]);

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
    
    // Delay preload to not block initial render
    const preload = () => {
      slideshowImages.slice(2).forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload, { timeout: 3000 });
    } else {
      setTimeout(preload, 2000);
    }
  }, [slideshowImages]);

  // Slideshow timer - runs for all themes
  useEffect(() => {
    if (!isVisible || themeLoading) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    const duration = getOptimalDuration();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideshowImages.length);
      setShowFirst((prev) => !prev);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isVisible, themeLoading, slideshowImages.length]);

  // Calculate which image goes on which layer
  const currentImage = slideshowImages[activeIndex];
  const prevImage = slideshowImages[(activeIndex - 1 + slideshowImages.length) % slideshowImages.length];

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
