import { useState, useEffect, memo } from "react";

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

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-background/40" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/60" />
    </div>
  );
});

HeroSlideshow.displayName = "HeroSlideshow";

export default HeroSlideshow;
