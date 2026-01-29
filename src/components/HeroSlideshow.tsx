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
import undergroundRace from "@/assets/slideshow/underground-race.jpg";
import yachtParty from "@/assets/slideshow/yacht-party.jpg";

// Import winter themed slideshow images
import winterSlide1 from "@/assets/themes/winter/slideshow-1.jpg";
import winterSlide2 from "@/assets/themes/winter/slideshow-2.jpg";
import winterSlide3 from "@/assets/themes/winter/slideshow-3.jpg";
import winterSlide4 from "@/assets/themes/winter/slideshow-4.jpg";
import winterSlide5 from "@/assets/themes/winter/slideshow-5.jpg";
import winterSlide6 from "@/assets/themes/winter/slideshow-6.jpg";
import winterSlide7 from "@/assets/themes/winter/slideshow-7.jpg";
import winterSlide8 from "@/assets/themes/winter/slideshow-8.jpg";
import winterSlide9 from "@/assets/themes/winter/slideshow-9.jpg";
import winterSlide10 from "@/assets/themes/winter/slideshow-10.jpg";

// Import christmas themed slideshow images
import christmasSlide1 from "@/assets/themes/christmas/slideshow-1.jpg";
import christmasSlide2 from "@/assets/themes/christmas/slideshow-2.jpg";
import christmasSlide3 from "@/assets/themes/christmas/slideshow-3.jpg";
import christmasSlide4 from "@/assets/themes/christmas/slideshow-4.jpg";
import christmasSlide5 from "@/assets/themes/christmas/slideshow-5.jpg";
import christmasSlide6 from "@/assets/themes/christmas/slideshow-6.jpg";
import christmasSlide7 from "@/assets/themes/christmas/slideshow-7.jpg";
import christmasSlide8 from "@/assets/themes/christmas/slideshow-8.jpg";
import christmasSlide9 from "@/assets/themes/christmas/slideshow-9.jpg";
import christmasSlide10 from "@/assets/themes/christmas/slideshow-10.jpg";

// Import halloween themed slideshow images
import halloweenSlide1 from "@/assets/themes/halloween/slideshow-1.jpg";
import halloweenSlide2 from "@/assets/themes/halloween/slideshow-2.jpg";
import halloweenSlide3 from "@/assets/themes/halloween/slideshow-3.jpg";
import halloweenSlide4 from "@/assets/themes/halloween/slideshow-4.jpg";
import halloweenSlide5 from "@/assets/themes/halloween/slideshow-5.jpg";
import halloweenSlide6 from "@/assets/themes/halloween/slideshow-6.jpg";
import halloweenSlide7 from "@/assets/themes/halloween/slideshow-7.jpg";
import halloweenSlide8 from "@/assets/themes/halloween/slideshow-8.jpg";
import halloweenSlide9 from "@/assets/themes/halloween/slideshow-9.jpg";
import halloweenSlide10 from "@/assets/themes/halloween/slideshow-10.jpg";

// Import diwali themed slideshow images
import diwaliSlide1 from "@/assets/themes/diwali/slideshow-1.jpg";
import diwaliSlide2 from "@/assets/themes/diwali/slideshow-2.jpg";
import diwaliSlide3 from "@/assets/themes/diwali/slideshow-3.jpg";
import diwaliSlide4 from "@/assets/themes/diwali/slideshow-4.jpg";
import diwaliSlide5 from "@/assets/themes/diwali/slideshow-5.jpg";
import diwaliSlide6 from "@/assets/themes/diwali/slideshow-6.jpg";
import diwaliSlide7 from "@/assets/themes/diwali/slideshow-7.jpg";
import diwaliSlide8 from "@/assets/themes/diwali/slideshow-8.jpg";
import diwaliSlide9 from "@/assets/themes/diwali/slideshow-9.jpg";
import diwaliSlide10 from "@/assets/themes/diwali/slideshow-10.jpg";

// Import holi themed slideshow images
import holiSlide1 from "@/assets/themes/holi/slideshow-1.jpg";
import holiSlide2 from "@/assets/themes/holi/slideshow-2.jpg";
import holiSlide3 from "@/assets/themes/holi/slideshow-3.jpg";
import holiSlide4 from "@/assets/themes/holi/slideshow-4.jpg";
import holiSlide5 from "@/assets/themes/holi/slideshow-5.jpg";
import holiSlide6 from "@/assets/themes/holi/slideshow-6.jpg";
import holiSlide7 from "@/assets/themes/holi/slideshow-7.jpg";
import holiSlide8 from "@/assets/themes/holi/slideshow-8.jpg";
import holiSlide9 from "@/assets/themes/holi/slideshow-9.jpg";
import holiSlide10 from "@/assets/themes/holi/slideshow-10.jpg";

// Import new year themed slideshow images
import newYearSlide1 from "@/assets/themes/new_year/slideshow-1.jpg";
import newYearSlide2 from "@/assets/themes/new_year/slideshow-2.jpg";
import newYearSlide3 from "@/assets/themes/new_year/slideshow-3.jpg";
import newYearSlide4 from "@/assets/themes/new_year/slideshow-4.jpg";
import newYearSlide5 from "@/assets/themes/new_year/slideshow-5.jpg";
import newYearSlide6 from "@/assets/themes/new_year/slideshow-6.jpg";
import newYearSlide7 from "@/assets/themes/new_year/slideshow-7.jpg";
import newYearSlide8 from "@/assets/themes/new_year/slideshow-8.jpg";
import newYearSlide9 from "@/assets/themes/new_year/slideshow-9.jpg";
import newYearSlide10 from "@/assets/themes/new_year/slideshow-10.jpg";

// Import birthday themed slideshow images
import birthdaySlide1 from "@/assets/themes/birthday/slideshow-1.jpg";
import birthdaySlide2 from "@/assets/themes/birthday/slideshow-2.jpg";
import birthdaySlide3 from "@/assets/themes/birthday/slideshow-3.jpg";
import birthdaySlide4 from "@/assets/themes/birthday/slideshow-4.jpg";
import birthdaySlide5 from "@/assets/themes/birthday/slideshow-5.jpg";
import birthdaySlide6 from "@/assets/themes/birthday/slideshow-6.jpg";
import birthdaySlide7 from "@/assets/themes/birthday/slideshow-7.jpg";
import birthdaySlide8 from "@/assets/themes/birthday/slideshow-8.jpg";
import birthdaySlide9 from "@/assets/themes/birthday/slideshow-9.jpg";
import birthdaySlide10 from "@/assets/themes/birthday/slideshow-10.jpg";

// Default slideshow images (10 images)
const DEFAULT_SLIDESHOW_IMAGES = [
  cityNight,
  policeChase,
  beachSunset,
  gangTerritory,
  nightclub,
  downtown,
  carMeet,
  highwaySunset,
  undergroundRace,
  yachtParty,
];

// Theme-specific slideshow images (10 images each)
const THEMED_SLIDESHOW_IMAGES: Record<ThemeType, string[]> = {
  default: DEFAULT_SLIDESHOW_IMAGES,
  winter: [winterSlide1, winterSlide2, winterSlide3, winterSlide4, winterSlide5, winterSlide6, winterSlide7, winterSlide8, winterSlide9, winterSlide10],
  christmas: [christmasSlide1, christmasSlide2, christmasSlide3, christmasSlide4, christmasSlide5, christmasSlide6, christmasSlide7, christmasSlide8, christmasSlide9, christmasSlide10],
  halloween: [halloweenSlide1, halloweenSlide2, halloweenSlide3, halloweenSlide4, halloweenSlide5, halloweenSlide6, halloweenSlide7, halloweenSlide8, halloweenSlide9, halloweenSlide10],
  diwali: [diwaliSlide1, diwaliSlide2, diwaliSlide3, diwaliSlide4, diwaliSlide5, diwaliSlide6, diwaliSlide7, diwaliSlide8, diwaliSlide9, diwaliSlide10],
  holi: [holiSlide1, holiSlide2, holiSlide3, holiSlide4, holiSlide5, holiSlide6, holiSlide7, holiSlide8, holiSlide9, holiSlide10],
  new_year: [newYearSlide1, newYearSlide2, newYearSlide3, newYearSlide4, newYearSlide5, newYearSlide6, newYearSlide7, newYearSlide8, newYearSlide9, newYearSlide10],
  birthday: [birthdaySlide1, birthdaySlide2, birthdaySlide3, birthdaySlide4, birthdaySlide5, birthdaySlide6, birthdaySlide7, birthdaySlide8, birthdaySlide9, birthdaySlide10],
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
