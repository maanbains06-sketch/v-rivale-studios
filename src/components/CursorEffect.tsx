import { useEffect, useState, useRef } from "react";

interface TrailPoint {
  x: number;
  y: number;
  id: number;
  timestamp: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  opacity: number;
  createdAt: number;
}

export const CursorEffect = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const trailIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX;
      const newY = e.clientY;
      
      // Calculate distance from last position
      const dx = newX - lastPositionRef.current.x;
      const dy = newY - lastPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      setPosition({ x: newX, y: newY });
      lastPositionRef.current = { x: newX, y: newY };
      
      // Add trail points more frequently when moving faster
      if (distance > 5) {
        setTrail((prev) => [
          ...prev,
          {
            x: newX,
            y: newY,
            id: trailIdRef.current++,
            timestamp: Date.now(),
          },
        ].slice(-25)); // Keep last 25 points
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Clean up old trail points
    const trailInterval = setInterval(() => {
      const now = Date.now();
      setTrail((prev) => prev.filter((point) => now - point.timestamp < 600));
    }, 50);

    // Generate particles continuously
    const particleInterval = setInterval(() => {
      const now = Date.now();
      
      // Create new particles from cursor position
      const newParticles: Particle[] = [];
      for (let i = 0; i < 4; i++) { // More particles per interval
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 0.6;
        const spreadX = (Math.random() - 0.5) * 20; // More horizontal spread
        newParticles.push({
          id: particleIdRef.current++,
          x: position.x + spreadX,
          y: position.y,
          velocityX: Math.cos(angle) * speed * 0.5,
          velocityY: -Math.abs(Math.sin(angle)) * speed - 1.2, // Faster upward movement
          size: 5 + Math.random() * 8, // Larger particles
          opacity: 0.7 + Math.random() * 0.3,
          createdAt: now,
        });
      }

      setParticles((prev) => [...prev, ...newParticles].slice(-100)); // Keep more particles
    }, 80); // More frequent generation

    // Animation loop for particle movement
    const animate = () => {
      setParticles((prev) => {
        const now = Date.now();
        return prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.velocityX,
            y: particle.y + particle.velocityY,
            opacity: Math.max(0, particle.opacity - 0.01),
          }))
          .filter((particle) => {
            const age = now - particle.createdAt;
            return age < 2000 && particle.opacity > 0; // Keep for 2 seconds
          });
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(trailInterval);
      clearInterval(particleInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [position.x, position.y]);

  return (
    <>
      {/* Floating cloud particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="pointer-events-none fixed z-50"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle, rgba(147, 197, 253, ${particle.opacity * 0.8}) 0%, rgba(96, 165, 250, ${particle.opacity * 0.6}) 40%, rgba(59, 130, 246, ${particle.opacity * 0.3}) 70%, transparent 90%)`,
              filter: "blur(4px)",
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 1.5}px rgba(96, 165, 250, ${particle.opacity * 0.4})`,
            }}
          />
        </div>
      ))}

      {/* Trail particles */}
      {trail.map((point, index) => {
        const age = Date.now() - point.timestamp;
        const opacity = Math.max(0, 1 - age / 600);
        const scale = 1 - age / 800;
        const size = 12 + index * 0.5;
        
        return (
          <div
            key={point.id}
            className="pointer-events-none fixed z-50"
            style={{
              left: `${point.x}px`,
              top: `${point.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="rounded-full transition-all duration-100"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                background: `radial-gradient(circle, rgba(147, 197, 253, ${opacity * 0.5}) 0%, rgba(96, 165, 250, ${opacity * 0.3}) 40%, transparent 70%)`,
                filter: "blur(6px)",
                opacity: opacity * 0.7,
                transform: `scale(${scale})`,
              }}
            />
          </div>
        );
      })}

      {/* Main cursor glow - very small */}
      <div
        className="pointer-events-none fixed z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            width: "28px",
            height: "28px",
            background: "radial-gradient(circle, rgba(147, 197, 253, 0.8) 0%, rgba(96, 165, 250, 0.5) 50%, transparent 80%)",
            filter: "blur(10px)",
            animation: "cursorPulse 1.5s ease-in-out infinite",
          }}
        />
        
        {/* Core bright spot */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            width: "14px",
            height: "14px",
            marginLeft: "7px",
            marginTop: "7px",
            background: "radial-gradient(circle, rgba(191, 219, 254, 0.9) 0%, rgba(147, 197, 253, 0.7) 50%, transparent 80%)",
            filter: "blur(5px)",
            boxShadow: "0 0 15px rgba(96, 165, 250, 0.6)",
          }}
        />
      </div>

      <style>{`
        @keyframes cursorPulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
};

