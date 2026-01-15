import { useState, useEffect, memo, useRef } from "react";

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

const SLIDE_DURATION = 4000; // 4 seconds per slide

const HeroSlideshow = memo(() => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFirst, setShowFirst] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload all images on mount
  useEffect(() => {
    SLIDESHOW_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
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
      {/* Layer 1 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${showFirst ? currentImage : prevImage})`,
          opacity: showFirst ? 1 : 0,
          transition: "opacity 1.5s ease-in-out",
        }}
      />
      
      {/* Layer 2 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${showFirst ? prevImage : currentImage})`,
          opacity: showFirst ? 0 : 1,
          transition: "opacity 1.5s ease-in-out",
        }}
      />

      {/* Dark overlay for text readability - reduced for better visibility */}
      <div className="absolute inset-0 bg-background/25" />
      
      {/* Gradient overlay - lighter for more visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/50" />
    </div>
  );
});

HeroSlideshow.displayName = "HeroSlideshow";

export default HeroSlideshow;
