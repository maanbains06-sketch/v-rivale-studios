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
          {/* Outer fog layer - rotating clockwise */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(ellipse 100% 80%, rgba(220, 38, 38, 0.4) 0%, rgba(220, 38, 38, 0.2) 30%, transparent 70%)",
              filter: "blur(20px)",
              animation: "fogRotate 8s linear infinite, fogPulse 2s ease-in-out infinite",
            }}
          />
          
          {/* Middle fog layer - rotating counter-clockwise */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(ellipse 90% 100%, rgba(239, 68, 68, 0.5) 0%, rgba(239, 68, 68, 0.25) 25%, transparent 60%)",
              filter: "blur(15px)",
              animation: "fogRotateReverse 6s linear infinite, fogPulse 1.8s ease-in-out infinite reverse",
            }}
          />
          
          {/* Swirling fog layer */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(ellipse 110% 70%, rgba(248, 113, 113, 0.6) 0%, rgba(248, 113, 113, 0.3) 20%, transparent 50%)",
              filter: "blur(10px)",
              animation: "fogSwirl 5s linear infinite",
            }}
          />
          
          {/* Inner glow - gentle drift */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(248, 113, 113, 0.6) 0%, rgba(248, 113, 113, 0.3) 20%, transparent 50%)",
              filter: "blur(10px)",
              animation: "fogDrift 4s ease-in-out infinite",
            }}
          />
          
          {/* Core bright spot */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(252, 165, 165, 0.8) 0%, rgba(252, 165, 165, 0.4) 15%, transparent 35%)",
              filter: "blur(5px)",
              animation: "fogPulse 2.5s ease-in-out infinite",
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
        
        @keyframes fogRotate {
          from {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.1);
          }
          to {
            transform: rotate(360deg) scale(1);
          }
        }
        
        @keyframes fogRotateReverse {
          from {
            transform: rotate(360deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(0.9);
          }
          to {
            transform: rotate(0deg) scale(1);
          }
        }
        
        @keyframes fogSwirl {
          0% {
            transform: rotate(0deg) scaleX(1) scaleY(1);
          }
          25% {
            transform: rotate(90deg) scaleX(1.2) scaleY(0.8);
          }
          50% {
            transform: rotate(180deg) scaleX(1) scaleY(1);
          }
          75% {
            transform: rotate(270deg) scaleX(0.8) scaleY(1.2);
          }
          100% {
            transform: rotate(360deg) scaleX(1) scaleY(1);
          }
        }
        
        @keyframes fogDrift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(3px, -3px) scale(1.05);
          }
          50% {
            transform: translate(-3px, 3px) scale(0.95);
          }
          75% {
            transform: translate(-3px, -3px) scale(1.05);
          }
        }
        
        @keyframes fogPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.15);
          }
        }
      `}</style>
    </>
  );
};
