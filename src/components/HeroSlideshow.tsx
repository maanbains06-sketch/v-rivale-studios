import { useState, useEffect, memo } from "react";

// Import all header images for the slideshow
import headerAbout from "@/assets/header-about.jpg";
import headerCommunity from "@/assets/header-community.jpg";
import headerFeatures from "@/assets/header-features.jpg";
import headerGallery from "@/assets/header-gallery.jpg";
import headerGang from "@/assets/header-gang.jpg";
import headerGuides from "@/assets/header-guides-new.jpg";
import headerRules from "@/assets/header-rules.jpg";
import headerStaff from "@/assets/header-staff.jpg";
import headerSupport from "@/assets/header-support.jpg";
import headerWhitelist from "@/assets/header-whitelist.jpg";

const SLIDESHOW_IMAGES = [
  headerAbout,
  headerCommunity,
  headerFeatures,
  headerGallery,
  headerGang,
  headerGuides,
  headerRules,
  headerStaff,
  headerSupport,
  headerWhitelist,
];

const SLIDE_DURATION = 5000; // 5 seconds per slide
const TRANSITION_DURATION = 1000; // 1 second fade transition

const HeroSlideshow = memo(() => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
        setIsTransitioning(false);
      }, TRANSITION_DURATION / 2);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, []);

  // Preload next image
  useEffect(() => {
    const nextIndex = (currentIndex + 1) % SLIDESHOW_IMAGES.length;
    const img = new Image();
    img.src = SLIDESHOW_IMAGES[nextIndex];
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Current slide */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity gpu-accelerated"
        style={{
          backgroundImage: `url(${SLIDESHOW_IMAGES[currentIndex]})`,
          opacity: isTransitioning ? 0 : 1,
          transitionDuration: `${TRANSITION_DURATION / 2}ms`,
          transitionProperty: 'opacity',
          transitionTimingFunction: 'ease-in-out',
        }}
      />
      
      {/* Next slide (for smooth transition) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat gpu-accelerated"
        style={{
          backgroundImage: `url(${SLIDESHOW_IMAGES[(currentIndex + 1) % SLIDESHOW_IMAGES.length]})`,
          opacity: isTransitioning ? 1 : 0,
          transitionDuration: `${TRANSITION_DURATION / 2}ms`,
          transitionProperty: 'opacity',
          transitionTimingFunction: 'ease-in-out',
        }}
      />

      {/* Subtle Ken Burns effect */}
      <style>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          100% {
            transform: scale(1.08) translate(-1%, -1%);
          }
        }
      `}</style>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-background/40" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/60" />
    </div>
  );
});

HeroSlideshow.displayName = "HeroSlideshow";

export default HeroSlideshow;
