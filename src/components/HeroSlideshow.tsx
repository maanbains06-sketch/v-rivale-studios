import { useState, useEffect, memo, useRef, useMemo } from "react";
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

// Lazy load theme images only when needed
const getThemeImages = async (theme: ThemeType): Promise<string[]> => {
  switch (theme) {
    case 'winter':
      const winter = await Promise.all([
        import("@/assets/themes/winter/slideshow-1.jpg"),
        import("@/assets/themes/winter/slideshow-2.jpg"),
        import("@/assets/themes/winter/slideshow-3.jpg"),
        import("@/assets/themes/winter/slideshow-4.jpg"),
        import("@/assets/themes/winter/slideshow-5.jpg"),
        import("@/assets/themes/winter/slideshow-6.jpg"),
        import("@/assets/themes/winter/slideshow-7.jpg"),
        import("@/assets/themes/winter/slideshow-8.jpg"),
        import("@/assets/themes/winter/slideshow-9.jpg"),
        import("@/assets/themes/winter/slideshow-10.jpg"),
      ]);
      return winter.map(m => m.default);
    case 'christmas':
      const christmas = await Promise.all([
        import("@/assets/themes/christmas/slideshow-1.jpg"),
        import("@/assets/themes/christmas/slideshow-2.jpg"),
        import("@/assets/themes/christmas/slideshow-3.jpg"),
        import("@/assets/themes/christmas/slideshow-4.jpg"),
        import("@/assets/themes/christmas/slideshow-5.jpg"),
        import("@/assets/themes/christmas/slideshow-6.jpg"),
        import("@/assets/themes/christmas/slideshow-7.jpg"),
        import("@/assets/themes/christmas/slideshow-8.jpg"),
        import("@/assets/themes/christmas/slideshow-9.jpg"),
        import("@/assets/themes/christmas/slideshow-10.jpg"),
      ]);
      return christmas.map(m => m.default);
    case 'halloween':
      const halloween = await Promise.all([
        import("@/assets/themes/halloween/slideshow-1.jpg"),
        import("@/assets/themes/halloween/slideshow-2.jpg"),
        import("@/assets/themes/halloween/slideshow-3.jpg"),
        import("@/assets/themes/halloween/slideshow-4.jpg"),
        import("@/assets/themes/halloween/slideshow-5.jpg"),
        import("@/assets/themes/halloween/slideshow-6.jpg"),
        import("@/assets/themes/halloween/slideshow-7.jpg"),
        import("@/assets/themes/halloween/slideshow-8.jpg"),
        import("@/assets/themes/halloween/slideshow-9.jpg"),
        import("@/assets/themes/halloween/slideshow-10.jpg"),
      ]);
      return halloween.map(m => m.default);
    case 'diwali':
      const diwali = await Promise.all([
        import("@/assets/themes/diwali/slideshow-1.jpg"),
        import("@/assets/themes/diwali/slideshow-2.jpg"),
        import("@/assets/themes/diwali/slideshow-3.jpg"),
        import("@/assets/themes/diwali/slideshow-4.jpg"),
        import("@/assets/themes/diwali/slideshow-5.jpg"),
        import("@/assets/themes/diwali/slideshow-6.jpg"),
        import("@/assets/themes/diwali/slideshow-7.jpg"),
        import("@/assets/themes/diwali/slideshow-8.jpg"),
        import("@/assets/themes/diwali/slideshow-9.jpg"),
        import("@/assets/themes/diwali/slideshow-10.jpg"),
      ]);
      return diwali.map(m => m.default);
    case 'holi':
      const holi = await Promise.all([
        import("@/assets/themes/holi/slideshow-1.jpg"),
        import("@/assets/themes/holi/slideshow-2.jpg"),
        import("@/assets/themes/holi/slideshow-3.jpg"),
        import("@/assets/themes/holi/slideshow-4.jpg"),
        import("@/assets/themes/holi/slideshow-5.jpg"),
        import("@/assets/themes/holi/slideshow-6.jpg"),
        import("@/assets/themes/holi/slideshow-7.jpg"),
        import("@/assets/themes/holi/slideshow-8.jpg"),
        import("@/assets/themes/holi/slideshow-9.jpg"),
        import("@/assets/themes/holi/slideshow-10.jpg"),
      ]);
      return holi.map(m => m.default);
    case 'new_year':
      const newYear = await Promise.all([
        import("@/assets/themes/new_year/slideshow-1.jpg"),
        import("@/assets/themes/new_year/slideshow-2.jpg"),
        import("@/assets/themes/new_year/slideshow-3.jpg"),
        import("@/assets/themes/new_year/slideshow-4.jpg"),
        import("@/assets/themes/new_year/slideshow-5.jpg"),
        import("@/assets/themes/new_year/slideshow-6.jpg"),
        import("@/assets/themes/new_year/slideshow-7.jpg"),
        import("@/assets/themes/new_year/slideshow-8.jpg"),
        import("@/assets/themes/new_year/slideshow-9.jpg"),
        import("@/assets/themes/new_year/slideshow-10.jpg"),
      ]);
      return newYear.map(m => m.default);
    case 'birthday':
      const birthday = await Promise.all([
        import("@/assets/themes/birthday/slideshow-1.jpg"),
        import("@/assets/themes/birthday/slideshow-2.jpg"),
        import("@/assets/themes/birthday/slideshow-3.jpg"),
        import("@/assets/themes/birthday/slideshow-4.jpg"),
        import("@/assets/themes/birthday/slideshow-5.jpg"),
        import("@/assets/themes/birthday/slideshow-6.jpg"),
        import("@/assets/themes/birthday/slideshow-7.jpg"),
        import("@/assets/themes/birthday/slideshow-8.jpg"),
        import("@/assets/themes/birthday/slideshow-9.jpg"),
        import("@/assets/themes/birthday/slideshow-10.jpg"),
      ]);
      return birthday.map(m => m.default);
    default:
      return [];
  }
};

// Default slideshow images (always loaded)
const DEFAULT_SLIDESHOW_IMAGES = [
  cityNight, policeChase, beachSunset, gangTerritory, nightclub,
  downtown, carMeet, highwaySunset, undergroundRace, yachtParty,
];

// Optimized slide duration
const SLIDE_DURATION_MOBILE = 8000;
const SLIDE_DURATION_DESKTOP = 6000;

const HeroSlideshow = memo(() => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFirst, setShowFirst] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [themeImages, setThemeImages] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { activeTheme, loading: themeLoading } = useActiveTheme();

  // Use default or loaded theme images
  const slideshowImages = useMemo(() => {
    if (activeTheme === 'default' || themeImages.length === 0) {
      return DEFAULT_SLIDESHOW_IMAGES;
    }
    return themeImages;
  }, [activeTheme, themeImages]);

  // Lazy load theme images when theme changes
  useEffect(() => {
    if (activeTheme === 'default') {
      setThemeImages([]);
      return;
    }

    let mounted = true;
    getThemeImages(activeTheme).then(images => {
      if (mounted && images.length > 0) {
        setThemeImages(images);
      }
    });

    return () => { mounted = false; };
  }, [activeTheme]);

  // Reset on theme change
  useEffect(() => {
    setActiveIndex(0);
    setShowFirst(true);
  }, [activeTheme]);

  // Visibility tracking (pause when tab hidden or scrolled away)
  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Intersection observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting && document.visibilityState === 'visible'),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Slideshow timer
  useEffect(() => {
    if (!isVisible || themeLoading) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const duration = isMobile ? SLIDE_DURATION_MOBILE : SLIDE_DURATION_DESKTOP;
    
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slideshowImages.length);
      setShowFirst(prev => !prev);
    }, duration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVisible, themeLoading, slideshowImages.length]);

  const currentImage = slideshowImages[activeIndex];
  const prevImage = slideshowImages[(activeIndex - 1 + slideshowImages.length) % slideshowImages.length];

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden">
      {/* Layer 1 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-[opacity]"
        style={{
          backgroundImage: `url(${showFirst ? currentImage : prevImage})`,
          opacity: showFirst ? 1 : 0,
          transition: "opacity 1.2s ease-in-out",
          transform: "translateZ(0)",
        }}
        aria-hidden="true"
      />
      
      {/* Layer 2 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-[opacity]"
        style={{
          backgroundImage: `url(${showFirst ? prevImage : currentImage})`,
          opacity: showFirst ? 0 : 1,
          transition: "opacity 1.2s ease-in-out",
          transform: "translateZ(0)",
        }}
        aria-hidden="true"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-background/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/50" />
    </div>
  );
});

HeroSlideshow.displayName = "HeroSlideshow";

export default HeroSlideshow;
