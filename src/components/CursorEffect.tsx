import { useEffect, useState, useRef } from "react";

interface TrailPoint {
  x: number;
  y: number;
  id: number;
  timestamp: number;
}

export const CursorEffect = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const trailIdRef = useRef(0);
  const lastPositionRef = useRef({ x: 0, y: 0 });

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
    const interval = setInterval(() => {
      const now = Date.now();
      setTrail((prev) => prev.filter((point) => now - point.timestamp < 600));
    }, 50);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Trail particles */}
      {trail.map((point, index) => {
        const age = Date.now() - point.timestamp;
        const opacity = Math.max(0, 1 - age / 600);
        const scale = 1 - age / 800;
        const size = 60 + index * 2;
        
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
                background: `radial-gradient(circle, rgba(239, 68, 68, ${opacity * 0.6}) 0%, rgba(220, 38, 38, ${opacity * 0.3}) 30%, transparent 70%)`,
                filter: "blur(15px)",
                opacity: opacity,
                transform: `scale(${scale})`,
              }}
            />
          </div>
        );
      })}

      {/* Main cursor glow */}
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
            width: "80px",
            height: "80px",
            background: "radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.4) 40%, transparent 70%)",
            filter: "blur(20px)",
            animation: "cursorPulse 1.5s ease-in-out infinite",
          }}
        />
        
        {/* Middle glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            width: "60px",
            height: "60px",
            marginLeft: "10px",
            marginTop: "10px",
            background: "radial-gradient(circle, rgba(248, 113, 113, 0.9) 0%, rgba(239, 68, 68, 0.5) 50%, transparent 70%)",
            filter: "blur(12px)",
            animation: "cursorPulse 1.2s ease-in-out infinite reverse",
          }}
        />
        
        {/* Core bright spot */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            width: "40px",
            height: "40px",
            marginLeft: "20px",
            marginTop: "20px",
            background: "radial-gradient(circle, rgba(252, 165, 165, 1) 0%, rgba(248, 113, 113, 0.7) 40%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
      </div>

      <style>{`
        @keyframes cursorPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
      `}</style>
    </>
  );
};

