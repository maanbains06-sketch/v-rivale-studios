import { useState, useEffect, memo, useCallback } from "react";

// Import all GTA 5 RP cinematic slideshow images
import cityNight from "@/assets/slideshow/city-night.jpg";
import policeChase from "@/assets/slideshow/police-chase.jpg";
import streetRacing from "@/assets/slideshow/street-racing.jpg";
import carDealership from "@/assets/slideshow/car-dealership.jpg";
import beachSunset from "@/assets/slideshow/beach-sunset.jpg";
import gangTerritory from "@/assets/slideshow/gang-territory.jpg";
import emsResponse from "@/assets/slideshow/ems-response.jpg";
import nightclub from "@/assets/slideshow/nightclub.jpg";
import mechanicGarage from "@/assets/slideshow/mechanic-garage.jpg";
import policeStation from "@/assets/slideshow/police-station.jpg";
import fireResponse from "@/assets/slideshow/fire-response.jpg";
import newsCrew from "@/assets/slideshow/news-crew.jpg";
import mansion from "@/assets/slideshow/mansion.jpg";
import highwaySunset from "@/assets/slideshow/highway-sunset.jpg";
import downtown from "@/assets/slideshow/downtown.jpg";
// New images
import carMeet from "@/assets/slideshow/car-meet.jpg";
import helicopterView from "@/assets/slideshow/helicopter-view.jpg";
import hospitalEmergency from "@/assets/slideshow/hospital-emergency.jpg";
import yachtParty from "@/assets/slideshow/yacht-party.jpg";
import tunnelRacing from "@/assets/slideshow/tunnel-racing.jpg";

const SLIDESHOW_IMAGES = [
  cityNight,
  policeChase,
  streetRacing,
  carDealership,
  beachSunset,
  gangTerritory,
  emsResponse,
  nightclub,
  mechanicGarage,
  policeStation,
  fireResponse,
  newsCrew,
  mansion,
  highwaySunset,
  downtown,
  carMeet,
  helicopterView,
  hospitalEmergency,
  yachtParty,
  tunnelRacing,
];

const SLIDE_DURATION = 7000; // 7 seconds per slide
const TRANSITION_DURATION = 1200; // 1.2 second smooth fade transition

const HeroSlideshow = memo(() => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const advanceSlide = useCallback(() => {
    setIsTransitioning(true);
    
    // Wait for fade out, then switch
    const timeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
      setNextIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
      setIsTransitioning(false);
    }, TRANSITION_DURATION);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(advanceSlide, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [advanceSlide]);

  // Preload next 2 images for smoother transitions
  useEffect(() => {
    const preloadIndices = [
      (currentIndex + 1) % SLIDESHOW_IMAGES.length,
      (currentIndex + 2) % SLIDESHOW_IMAGES.length,
    ];
    
    preloadIndices.forEach((index) => {
      const img = new Image();
      img.src = SLIDESHOW_IMAGES[index];
    });
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Current slide */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-opacity"
        style={{
          backgroundImage: `url(${SLIDESHOW_IMAGES[currentIndex]})`,
          opacity: isTransitioning ? 0 : 1,
          transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`,
        }}
      />
      
      {/* Next slide (for smooth crossfade) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-opacity"
        style={{
          backgroundImage: `url(${SLIDESHOW_IMAGES[nextIndex]})`,
          opacity: isTransitioning ? 1 : 0,
          transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`,
        }}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-background/40" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/60" />
    </div>
  );
});

HeroSlideshow.displayName = "HeroSlideshow";

export default HeroSlideshow;
