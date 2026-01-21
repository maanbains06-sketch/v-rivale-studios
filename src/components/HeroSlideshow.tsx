import { useState, useEffect, memo, useRef } from "react";

// Import only 8 essential slideshow images for better performance (reduced from 20)
import cityNight from "@/assets/slideshow/city-night.jpg";
import policeChase from "@/assets/slideshow/police-chase.jpg";
import beachSunset from "@/assets/slideshow/beach-sunset.jpg";
import gangTerritory from "@/assets/slideshow/gang-territory.jpg";
import nightclub from "@/assets/slideshow/nightclub.jpg";
import downtown from "@/assets/slideshow/downtown.jpg";
import carMeet from "@/assets/slideshow/car-meet.jpg";
import highwaySunset from "@/assets/slideshow/highway-sunset.jpg";

// Reduced image set for faster loading
const SLIDESHOW_IMAGES = [
  cityNight,
  policeChase,
  beachSunset,
  gangTerritory,
  nightclub,
  downtown,
  carMeet,
  highwaySunset,
];

const SLIDE_DURATION = 5000; // 5 seconds per slide (increased for less CPU usage)

const HeroSlideshow = memo(() => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFirst, setShowFirst] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const preloadedRef = useRef(false);

  // Lazy preload images after initial render
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    
    // Delay preload to not block initial render
    const preloadTimeout = setTimeout(() => {
      SLIDESHOW_IMAGES.slice(2).forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }, 2000);

    return () => clearTimeout(preloadTimeout);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
      setShowFirst((prev) => !prev);
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Calculate which image goes on which layer
  const currentImage = SLIDESHOW_IMAGES[activeIndex];
  const prevImage = SLIDESHOW_IMAGES[(activeIndex - 1 + SLIDESHOW_IMAGES.length) % SLIDESHOW_IMAGES.length];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Layer 1 - Using will-change for GPU acceleration */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-[opacity]"
        style={{
          backgroundImage: `url(${showFirst ? currentImage : prevImage})`,
          opacity: showFirst ? 1 : 0,
          transition: "opacity 1.2s ease-in-out",
        }}
      />
      
      {/* Layer 2 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-[opacity]"
        style={{
          backgroundImage: `url(${showFirst ? prevImage : currentImage})`,
          opacity: showFirst ? 0 : 1,
          transition: "opacity 1.2s ease-in-out",
        }}
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
