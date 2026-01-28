import { memo, useMemo } from 'react';
import { useActiveTheme, ThemeType } from '@/hooks/useActiveTheme';

// Memoized individual decoration components for performance
const DiwaliDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Floating Diyas (Oil Lamps) */}
    {[...Array(12)].map((_, i) => (
      <div
        key={`diya-${i}`}
        className="absolute animate-float"
        style={{
          left: `${5 + i * 8}%`,
          top: `${10 + (i % 3) * 5}%`,
          animationDelay: `${i * 0.3}s`,
          animationDuration: `${3 + (i % 2)}s`,
        }}
      >
        <div className="relative">
          <span className="text-2xl md:text-3xl">🪔</span>
          <div 
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-3 rounded-full blur-sm animate-pulse"
            style={{ background: 'radial-gradient(circle, #ff9933 0%, #ff6600 50%, transparent 100%)' }}
          />
        </div>
      </div>
    ))}
    
    {/* Rangoli Corners */}
    <div className="absolute bottom-4 left-4 text-4xl md:text-6xl opacity-70">🌸</div>
    <div className="absolute bottom-4 right-4 text-4xl md:text-6xl opacity-70">🌸</div>
    
    {/* Sparkle Effects */}
    {[...Array(20)].map((_, i) => (
      <div
        key={`sparkle-${i}`}
        className="absolute animate-pulse-slow"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
        }}
      >
        <span className="text-sm md:text-base opacity-60">✨</span>
      </div>
    ))}
    
    {/* Golden Border Glow */}
    <div className="absolute inset-0 border-4 border-transparent pointer-events-none"
      style={{
        boxShadow: 'inset 0 0 60px rgba(255, 153, 0, 0.15), inset 0 0 120px rgba(255, 100, 0, 0.1)'
      }}
    />
  </div>
));
DiwaliDecorations.displayName = 'DiwaliDecorations';

const HoliDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Floating Color Splashes */}
    {['#FF1493', '#00FF00', '#FFD700', '#FF4500', '#9400D3', '#00CED1', '#FF69B4', '#32CD32'].map((color, i) => (
      <div
        key={`splash-${i}`}
        className="absolute rounded-full animate-float opacity-30"
        style={{
          left: `${10 + i * 10}%`,
          top: `${5 + (i % 4) * 8}%`,
          width: `${30 + i * 10}px`,
          height: `${30 + i * 10}px`,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${4 + (i % 3)}s`,
          filter: 'blur(8px)',
        }}
      />
    ))}
    
    {/* Color Powder Puffs */}
    {[...Array(15)].map((_, i) => (
      <div
        key={`puff-${i}`}
        className="absolute animate-pulse-slow"
        style={{
          left: `${Math.random() * 90}%`,
          top: `${Math.random() * 40}%`,
          animationDelay: `${Math.random() * 2}s`,
        }}
      >
        <span className="text-xl md:text-2xl" style={{ filter: 'hue-rotate(' + (i * 30) + 'deg)' }}>💥</span>
      </div>
    ))}
    
    {/* Rainbow Border */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        boxShadow: 'inset 0 0 80px rgba(255, 20, 147, 0.1), inset 0 0 120px rgba(0, 255, 0, 0.08), inset 0 0 160px rgba(255, 215, 0, 0.06)'
      }}
    />
  </div>
));
HoliDecorations.displayName = 'HoliDecorations';

const HalloweenDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Flying Bats */}
    {[...Array(8)].map((_, i) => (
      <div
        key={`bat-${i}`}
        className="absolute"
        style={{
          left: `${5 + i * 12}%`,
          top: `${8 + (i % 3) * 6}%`,
          animation: `float ${3 + i % 2}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }}
      >
        <span className="text-2xl md:text-3xl opacity-70">🦇</span>
      </div>
    ))}
    
    {/* Pumpkins */}
    <div className="absolute bottom-4 left-8 text-4xl md:text-5xl">🎃</div>
    <div className="absolute bottom-4 right-8 text-4xl md:text-5xl">🎃</div>
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-5xl md:text-6xl">🎃</div>
    
    {/* Spider Webs */}
    <div className="absolute top-0 left-0 text-4xl md:text-6xl opacity-40">🕸️</div>
    <div className="absolute top-0 right-0 text-4xl md:text-6xl opacity-40 scale-x-[-1]">🕸️</div>
    
    {/* Ghosts */}
    {[...Array(5)].map((_, i) => (
      <div
        key={`ghost-${i}`}
        className="absolute animate-float"
        style={{
          right: `${10 + i * 15}%`,
          top: `${20 + i * 10}%`,
          animationDelay: `${i * 0.6}s`,
          animationDuration: `${4 + i}s`,
        }}
      >
        <span className="text-xl md:text-2xl opacity-50">👻</span>
      </div>
    ))}
    
    {/* Spooky Glow */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        boxShadow: 'inset 0 0 100px rgba(255, 102, 0, 0.1), inset 0 0 150px rgba(128, 0, 128, 0.08)'
      }}
    />
  </div>
));
HalloweenDecorations.displayName = 'HalloweenDecorations';

const WinterDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Falling Snowflakes */}
    {[...Array(30)].map((_, i) => (
      <div
        key={`snow-${i}`}
        className="absolute animate-fall-snow"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 20}%`,
          animationDuration: `${5 + Math.random() * 10}s`,
          animationDelay: `${Math.random() * 5}s`,
          fontSize: `${10 + Math.random() * 15}px`,
          opacity: 0.4 + Math.random() * 0.4,
        }}
      >
        ❄️
      </div>
    ))}
    
    {/* Ice Crystals at corners */}
    <div className="absolute top-0 left-0 text-4xl md:text-6xl opacity-40">❄️</div>
    <div className="absolute top-0 right-0 text-4xl md:text-6xl opacity-40">❄️</div>
    <div className="absolute bottom-0 left-0 text-4xl md:text-6xl opacity-40">❄️</div>
    <div className="absolute bottom-0 right-0 text-4xl md:text-6xl opacity-40">❄️</div>
    
    {/* Frost Effect */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        boxShadow: 'inset 0 0 100px rgba(135, 206, 250, 0.15), inset 0 0 200px rgba(255, 255, 255, 0.1)'
      }}
    />
  </div>
));
WinterDecorations.displayName = 'WinterDecorations';

const ChristmasDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Snowflakes */}
    {[...Array(20)].map((_, i) => (
      <div
        key={`xmas-snow-${i}`}
        className="absolute animate-fall-snow"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 20}%`,
          animationDuration: `${6 + Math.random() * 8}s`,
          animationDelay: `${Math.random() * 4}s`,
          fontSize: `${12 + Math.random() * 12}px`,
          opacity: 0.5 + Math.random() * 0.3,
        }}
      >
        ❄️
      </div>
    ))}
    
    {/* Christmas Lights at top */}
    <div className="absolute top-0 left-0 right-0 flex justify-around">
      {[...Array(15)].map((_, i) => (
        <div
          key={`light-${i}`}
          className="animate-pulse"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.5s',
          }}
        >
          <span className="text-lg md:text-xl">
            {['🔴', '🟢', '🟡', '🔵'][i % 4]}
          </span>
        </div>
      ))}
    </div>
    
    {/* Christmas Trees */}
    <div className="absolute bottom-4 left-4 text-4xl md:text-5xl">🎄</div>
    <div className="absolute bottom-4 right-4 text-4xl md:text-5xl">🎄</div>
    
    {/* Presents & Stars */}
    <div className="absolute bottom-4 left-20 text-2xl md:text-3xl">🎁</div>
    <div className="absolute bottom-4 right-20 text-2xl md:text-3xl">🎁</div>
    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-3xl md:text-4xl animate-pulse">⭐</div>
    
    {/* Festive Glow */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        boxShadow: 'inset 0 0 80px rgba(255, 0, 0, 0.08), inset 0 0 120px rgba(0, 128, 0, 0.06)'
      }}
    />
  </div>
));
ChristmasDecorations.displayName = 'ChristmasDecorations';

const NewYearDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Fireworks */}
    {[...Array(10)].map((_, i) => (
      <div
        key={`firework-${i}`}
        className="absolute animate-pulse"
        style={{
          left: `${10 + i * 9}%`,
          top: `${10 + (i % 4) * 8}%`,
          animationDelay: `${i * 0.3}s`,
          animationDuration: `${1 + (i % 2)}s`,
        }}
      >
        <span className="text-2xl md:text-3xl">🎆</span>
      </div>
    ))}
    
    {/* Confetti */}
    {[...Array(25)].map((_, i) => (
      <div
        key={`confetti-${i}`}
        className="absolute animate-fall-confetti"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 10}%`,
          animationDuration: `${3 + Math.random() * 4}s`,
          animationDelay: `${Math.random() * 3}s`,
        }}
      >
        <span className="text-base md:text-lg">
          {['🎊', '🎉', '✨', '🌟'][Math.floor(Math.random() * 4)]}
        </span>
      </div>
    ))}
    
    {/* Champagne */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl md:text-5xl">🥂</div>
    
    {/* Party Poppers */}
    <div className="absolute bottom-4 left-8 text-3xl md:text-4xl">🎉</div>
    <div className="absolute bottom-4 right-8 text-3xl md:text-4xl scale-x-[-1]">🎉</div>
    
    {/* Golden Glow */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        boxShadow: 'inset 0 0 100px rgba(255, 215, 0, 0.1), inset 0 0 150px rgba(255, 165, 0, 0.08)'
      }}
    />
  </div>
));
NewYearDecorations.displayName = 'NewYearDecorations';

const BirthdayDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Balloons */}
    {['🎈', '🎈', '🎈', '🎈', '🎈', '🎈'].map((balloon, i) => (
      <div
        key={`balloon-${i}`}
        className="absolute animate-float"
        style={{
          left: `${8 + i * 15}%`,
          bottom: '10%',
          animationDelay: `${i * 0.4}s`,
          animationDuration: `${3 + (i % 2)}s`,
          filter: `hue-rotate(${i * 50}deg)`,
        }}
      >
        <span className="text-3xl md:text-4xl">{balloon}</span>
      </div>
    ))}
    
    {/* Birthday Cake */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl md:text-5xl">🎂</div>
    
    {/* Party Hats */}
    <div className="absolute top-4 left-8 text-2xl md:text-3xl">🥳</div>
    <div className="absolute top-4 right-8 text-2xl md:text-3xl scale-x-[-1]">🥳</div>
    
    {/* Presents */}
    <div className="absolute bottom-4 left-20 text-2xl md:text-3xl">🎁</div>
    <div className="absolute bottom-4 right-20 text-2xl md:text-3xl">🎁</div>
    
    {/* Confetti */}
    {[...Array(20)].map((_, i) => (
      <div
        key={`bd-confetti-${i}`}
        className="absolute animate-fall-confetti"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 10}%`,
          animationDuration: `${4 + Math.random() * 4}s`,
          animationDelay: `${Math.random() * 3}s`,
        }}
      >
        <span className="text-sm md:text-base">
          {['🎊', '🎉', '✨', '⭐'][Math.floor(Math.random() * 4)]}
        </span>
      </div>
    ))}
    
    {/* Colorful Glow */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        boxShadow: 'inset 0 0 80px rgba(255, 105, 180, 0.1), inset 0 0 120px rgba(138, 43, 226, 0.08)'
      }}
    />
  </div>
));
BirthdayDecorations.displayName = 'BirthdayDecorations';

const ThemeDecorations = memo(() => {
  const { activeTheme, loading } = useActiveTheme();

  const decorationComponent = useMemo(() => {
    if (loading) return null;
    
    switch (activeTheme) {
      case 'diwali':
        return <DiwaliDecorations />;
      case 'holi':
        return <HoliDecorations />;
      case 'halloween':
        return <HalloweenDecorations />;
      case 'winter':
        return <WinterDecorations />;
      case 'christmas':
        return <ChristmasDecorations />;
      case 'new_year':
        return <NewYearDecorations />;
      case 'birthday':
        return <BirthdayDecorations />;
      case 'default':
      default:
        return null;
    }
  }, [activeTheme, loading]);

  return decorationComponent;
});

ThemeDecorations.displayName = 'ThemeDecorations';

export default ThemeDecorations;
