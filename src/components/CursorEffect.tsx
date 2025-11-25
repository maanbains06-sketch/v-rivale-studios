import { useEffect, useState } from "react";

export const CursorEffect = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {/* Main fog effect */}
      <div
        className="pointer-events-none fixed z-50 transition-opacity duration-300"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
          opacity: isMoving ? 0.6 : 0.3,
        }}
      >
        <div className="relative h-32 w-32">
          {/* Outer fog layer */}
          <div
            className="absolute inset-0 animate-pulse rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, rgba(220, 38, 38, 0.2) 30%, transparent 70%)",
              filter: "blur(20px)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          
          {/* Middle fog layer */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, rgba(239, 68, 68, 0.25) 25%, transparent 60%)",
              filter: "blur(15px)",
              animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite reverse",
            }}
          />
          
          {/* Inner glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(248, 113, 113, 0.6) 0%, rgba(248, 113, 113, 0.3) 20%, transparent 50%)",
              filter: "blur(10px)",
            }}
          />
          
          {/* Core bright spot */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(252, 165, 165, 0.8) 0%, rgba(252, 165, 165, 0.4) 15%, transparent 35%)",
              filter: "blur(5px)",
            }}
          />
        </div>
      </div>

      {/* Trail particles */}
      {isMoving && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="h-20 w-20 rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 60%)",
              filter: "blur(12px)",
              animation: "fadeOut 0.8s ease-out forwards",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeOut {
          from {
            opacity: 0.4;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(1.5);
          }
        }
      `}</style>
    </>
  );
};
