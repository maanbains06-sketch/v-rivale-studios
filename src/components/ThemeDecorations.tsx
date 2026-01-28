import { memo, useMemo } from 'react';
import { useActiveTheme, ThemeType } from '@/hooks/useActiveTheme';

// Memoized individual decoration components for performance
const DiwaliDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Corner Diyas */}
    <div className="absolute top-4 left-4 text-3xl md:text-4xl animate-pulse">🪔</div>
    <div className="absolute top-4 right-4 text-3xl md:text-4xl animate-pulse" style={{ animationDelay: '0.5s' }}>🪔</div>
    <div className="absolute bottom-4 left-4 text-3xl md:text-4xl animate-pulse" style={{ animationDelay: '1s' }}>🪔</div>
    <div className="absolute bottom-4 right-4 text-3xl md:text-4xl animate-pulse" style={{ animationDelay: '1.5s' }}>🪔</div>
    
    {/* Side Diyas */}
    <div className="absolute top-1/4 left-4 text-2xl animate-pulse opacity-70" style={{ animationDelay: '0.3s' }}>🪔</div>
    <div className="absolute top-1/2 left-4 text-2xl animate-pulse opacity-70" style={{ animationDelay: '0.8s' }}>🪔</div>
    <div className="absolute top-3/4 left-4 text-2xl animate-pulse opacity-70" style={{ animationDelay: '1.3s' }}>🪔</div>
    <div className="absolute top-1/4 right-4 text-2xl animate-pulse opacity-70" style={{ animationDelay: '0.5s' }}>🪔</div>
    <div className="absolute top-1/2 right-4 text-2xl animate-pulse opacity-70" style={{ animationDelay: '1s' }}>🪔</div>
    <div className="absolute top-3/4 right-4 text-2xl animate-pulse opacity-70" style={{ animationDelay: '1.5s' }}>🪔</div>
    
    {/* Floating Sparkles across page */}
    {[...Array(15)].map((_, i) => (
      <div
        key={`sparkle-${i}`}
        className="absolute animate-float-sparkle"
        style={{
          left: `${8 + (i * 6)}%`,
          top: `${10 + (i % 5) * 18}%`,
          animationDelay: `${i * 0.4}s`,
          animationDuration: `${4 + (i % 3)}s`,
        }}
      >
        <span className="text-lg md:text-xl opacity-60">✨</span>
      </div>
    ))}
    
    {/* Top Border Decoration */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
    <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
    
    {/* Bottom Border Decoration */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
    
    {/* Side Border Decorations */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
    
    {/* Rangoli Corners */}
    <div className="absolute top-12 left-12 text-2xl md:text-3xl opacity-60">🌸</div>
    <div className="absolute top-12 right-12 text-2xl md:text-3xl opacity-60">🌸</div>
    <div className="absolute bottom-12 left-12 text-2xl md:text-3xl opacity-60">🌸</div>
    <div className="absolute bottom-12 right-12 text-2xl md:text-3xl opacity-60">🌸</div>
    
    {/* Ambient Corner Glow */}
    <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-amber-500/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-orange-500/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-orange-500/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-amber-500/20 to-transparent rounded-full blur-3xl" />
    
    {/* Decorative Border Frame */}
    <div className="absolute inset-4 border-2 border-amber-500/20 rounded-lg pointer-events-none" />
  </div>
));
DiwaliDecorations.displayName = 'DiwaliDecorations';

const HoliDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Floating Color Splashes across page */}
    {['#FF1493', '#00FF00', '#FFD700', '#FF4500', '#9400D3', '#00CED1', '#FF69B4', '#32CD32', '#FFA500', '#8A2BE2'].map((color, i) => (
      <div
        key={`splash-${i}`}
        className="absolute rounded-full animate-float-color"
        style={{
          left: `${5 + i * 10}%`,
          top: `${8 + (i % 4) * 22}%`,
          width: `${40 + i * 8}px`,
          height: `${40 + i * 8}px`,
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${5 + (i % 3)}s`,
          filter: 'blur(10px)',
        }}
      />
    ))}
    
    {/* Color Powder Bursts */}
    {[...Array(12)].map((_, i) => (
      <div
        key={`puff-${i}`}
        className="absolute animate-pulse-slow"
        style={{
          left: `${8 + (i * 8)}%`,
          top: `${15 + (i % 4) * 20}%`,
          animationDelay: `${i * 0.3}s`,
        }}
      >
        <span className="text-xl md:text-2xl opacity-50" style={{ filter: 'hue-rotate(' + (i * 35) + 'deg)' }}>💥</span>
      </div>
    ))}
    
    {/* Rainbow Top Border */}
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500/60 via-yellow-500/60 to-green-500/60" />
    <div className="absolute top-1.5 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/40 via-orange-500/40 to-cyan-500/40" />
    
    {/* Rainbow Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500/60 via-yellow-500/60 to-pink-500/60" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-pink-500/50 via-yellow-500/50 to-green-500/50" />
    <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-gradient-to-b from-green-500/50 via-yellow-500/50 to-pink-500/50" />
    
    {/* Corner Emojis */}
    <div className="absolute top-4 left-4 text-2xl md:text-3xl">💥</div>
    <div className="absolute top-4 right-4 text-2xl md:text-3xl">💥</div>
    <div className="absolute bottom-4 left-4 text-2xl md:text-3xl">🎨</div>
    <div className="absolute bottom-4 right-4 text-2xl md:text-3xl">🎨</div>
    
    {/* Side Splashes */}
    <div className="absolute top-1/3 left-4 text-xl opacity-60">🌈</div>
    <div className="absolute top-2/3 right-4 text-xl opacity-60">🌈</div>
    
    {/* Decorative Frame */}
    <div className="absolute inset-3 border-2 border-dashed border-pink-400/20 rounded-xl pointer-events-none" />
  </div>
));
HoliDecorations.displayName = 'HoliDecorations';

const HalloweenDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Flying Bats across page */}
    {[...Array(10)].map((_, i) => (
      <div
        key={`bat-${i}`}
        className="absolute animate-float-spooky"
        style={{
          left: `${5 + i * 10}%`,
          top: `${8 + (i % 4) * 20}%`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${4 + (i % 3)}s`,
        }}
      >
        <span className="text-xl md:text-2xl opacity-60">🦇</span>
      </div>
    ))}
    
    {/* Floating Ghosts */}
    {[...Array(6)].map((_, i) => (
      <div
        key={`ghost-${i}`}
        className="absolute animate-float-ghost"
        style={{
          left: `${15 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
          animationDelay: `${i * 0.7}s`,
          animationDuration: `${5 + (i % 2)}s`,
        }}
      >
        <span className="text-lg md:text-xl opacity-40">👻</span>
      </div>
    ))}
    
    {/* Spooky Top Border */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-600/50 via-purple-600/50 to-orange-600/50" />
    
    {/* Spooky Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600/50 via-orange-600/50 to-purple-600/50" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-orange-600/40 via-purple-800/40 to-orange-600/40" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-orange-600/40 via-purple-800/40 to-orange-600/40" />
    
    {/* Corner Spider Webs */}
    <div className="absolute top-0 left-0 text-4xl md:text-5xl opacity-50">🕸️</div>
    <div className="absolute top-0 right-0 text-4xl md:text-5xl opacity-50 scale-x-[-1]">🕸️</div>
    
    {/* Corner Pumpkins */}
    <div className="absolute bottom-4 left-4 text-3xl md:text-4xl">🎃</div>
    <div className="absolute bottom-4 right-4 text-3xl md:text-4xl">🎃</div>
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl md:text-5xl">🎃</div>
    
    {/* Spooky Skulls on sides */}
    <div className="absolute top-1/3 left-4 text-xl opacity-50">💀</div>
    <div className="absolute top-2/3 right-4 text-xl opacity-50">💀</div>
    
    {/* Spooky Corner Glow */}
    <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-purple-600/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-orange-600/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-orange-600/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-purple-600/20 to-transparent rounded-full blur-3xl" />
    
    {/* Decorative Frame */}
    <div className="absolute inset-4 border-2 border-orange-500/15 rounded-lg pointer-events-none" />
  </div>
));
HalloweenDecorations.displayName = 'HalloweenDecorations';

const WinterDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Falling Snowflakes across entire page */}
    {[...Array(25)].map((_, i) => (
      <div
        key={`snow-${i}`}
        className="absolute animate-fall-snow-slow"
        style={{
          left: `${4 + i * 4}%`,
          top: '-5%',
          animationDuration: `${8 + (i % 5) * 3}s`,
          animationDelay: `${(i % 8) * 1.5}s`,
          fontSize: `${12 + (i % 4) * 4}px`,
          opacity: 0.3 + (i % 3) * 0.15,
        }}
      >
        ❄️
      </div>
    ))}
    
    {/* Frost Top Border */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent" />
    <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    
    {/* Frost Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent" />
    
    {/* Frost Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-transparent via-sky-300/40 to-transparent" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-transparent via-sky-300/40 to-transparent" />
    
    {/* Corner Snowflakes */}
    <div className="absolute top-4 left-4 text-3xl md:text-4xl opacity-70">❄️</div>
    <div className="absolute top-4 right-4 text-3xl md:text-4xl opacity-70">❄️</div>
    <div className="absolute bottom-4 left-4 text-3xl md:text-4xl opacity-70">❄️</div>
    <div className="absolute bottom-4 right-4 text-3xl md:text-4xl opacity-70">❄️</div>
    
    {/* Side Snowflakes */}
    <div className="absolute top-1/4 left-4 text-xl md:text-2xl opacity-50">❄️</div>
    <div className="absolute top-1/2 left-4 text-xl md:text-2xl opacity-50">❄️</div>
    <div className="absolute top-3/4 left-4 text-xl md:text-2xl opacity-50">❄️</div>
    <div className="absolute top-1/4 right-4 text-xl md:text-2xl opacity-50">❄️</div>
    <div className="absolute top-1/2 right-4 text-xl md:text-2xl opacity-50">❄️</div>
    <div className="absolute top-3/4 right-4 text-xl md:text-2xl opacity-50">❄️</div>
    
    {/* Snowman */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-3xl md:text-4xl">⛄</div>
    
    {/* Corner Frost Glow */}
    <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-sky-300/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-sky-300/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-sky-300/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-sky-300/20 to-transparent rounded-full blur-3xl" />
    
    {/* Frost Frame */}
    <div className="absolute inset-4 border border-sky-300/20 rounded-lg pointer-events-none" />
  </div>
));
WinterDecorations.displayName = 'WinterDecorations';

const ChristmasDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Falling Snow */}
    {[...Array(20)].map((_, i) => (
      <div
        key={`xmas-snow-${i}`}
        className="absolute animate-fall-snow-slow"
        style={{
          left: `${5 + i * 5}%`,
          top: '-5%',
          animationDuration: `${10 + (i % 4) * 3}s`,
          animationDelay: `${(i % 6) * 2}s`,
          fontSize: `${10 + (i % 3) * 4}px`,
          opacity: 0.25 + (i % 3) * 0.1,
        }}
      >
        ❄️
      </div>
    ))}
    
    {/* Christmas Lights Top Border */}
    <div className="absolute top-0 left-0 right-0 flex justify-around py-1">
      {[...Array(15)].map((_, i) => (
        <div
          key={`light-${i}`}
          className="animate-pulse"
          style={{
            animationDelay: `${i * 0.3}s`,
            animationDuration: '2s',
          }}
        >
          <span className="text-base md:text-lg">
            {['🔴', '🟢', '🟡', '🔵'][i % 4]}
          </span>
        </div>
      ))}
    </div>
    
    {/* Side Lights */}
    <div className="absolute top-16 left-2 flex flex-col gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={`left-light-${i}`} className="animate-pulse" style={{ animationDelay: `${i * 0.4}s` }}>
          <span className="text-sm md:text-base">{['🔴', '🟢', '🟡', '🔵'][i % 4]}</span>
        </div>
      ))}
    </div>
    <div className="absolute top-16 right-2 flex flex-col gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={`right-light-${i}`} className="animate-pulse" style={{ animationDelay: `${i * 0.4 + 0.2}s` }}>
          <span className="text-sm md:text-base">{['🟢', '🔴', '🔵', '🟡'][i % 4]}</span>
        </div>
      ))}
    </div>
    
    {/* Red & Green Border */}
    <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-red-500/40 via-green-500/40 to-red-500/40" />
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-600/50 via-red-600/50 to-green-600/50" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-red-500/40 via-green-500/40 to-red-500/40" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-green-500/40 via-red-500/40 to-green-500/40" />
    
    {/* Corner Christmas Trees */}
    <div className="absolute bottom-4 left-4 text-3xl md:text-4xl">🎄</div>
    <div className="absolute bottom-4 right-4 text-3xl md:text-4xl">🎄</div>
    
    {/* Presents */}
    <div className="absolute bottom-4 left-16 text-2xl md:text-3xl">🎁</div>
    <div className="absolute bottom-4 right-16 text-2xl md:text-3xl">🎁</div>
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-2xl md:text-3xl">🎁</div>
    
    {/* Top Star */}
    <div className="absolute top-10 left-1/2 -translate-x-1/2 text-2xl md:text-3xl animate-pulse">⭐</div>
    
    {/* Side Decorations */}
    <div className="absolute top-1/3 left-10 text-xl opacity-60">🎅</div>
    <div className="absolute top-1/2 right-10 text-xl opacity-60">☃️</div>
    <div className="absolute top-2/3 left-10 text-xl opacity-60">🦌</div>
    
    {/* Festive Corner Glow */}
    <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-red-500/15 to-transparent rounded-full blur-3xl" />
    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-green-500/15 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-green-500/15 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-red-500/15 to-transparent rounded-full blur-3xl" />
    
    {/* Festive Frame */}
    <div className="absolute inset-4 border border-green-500/15 rounded-lg pointer-events-none" />
  </div>
));
ChristmasDecorations.displayName = 'ChristmasDecorations';

const NewYearDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Falling Confetti across page */}
    {[...Array(20)].map((_, i) => (
      <div
        key={`confetti-${i}`}
        className="absolute animate-fall-confetti-slow"
        style={{
          left: `${5 + i * 5}%`,
          top: '-5%',
          animationDuration: `${6 + (i % 4) * 2}s`,
          animationDelay: `${(i % 7) * 1}s`,
        }}
      >
        <span className="text-base md:text-lg opacity-60">
          {['🎊', '✨', '🌟', '🎉', '⭐'][i % 5]}
        </span>
      </div>
    ))}
    
    {/* Fireworks across top */}
    {[...Array(8)].map((_, i) => (
      <div
        key={`firework-${i}`}
        className="absolute animate-pulse"
        style={{
          left: `${10 + i * 11}%`,
          top: `${8 + (i % 3) * 8}%`,
          animationDelay: `${i * 0.4}s`,
          animationDuration: `${1.5 + (i % 2)}s`,
        }}
      >
        <span className="text-2xl md:text-3xl">🎆</span>
      </div>
    ))}
    
    {/* Golden Top Border */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
    <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
    
    {/* Golden Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent" />
    
    {/* Bottom Celebration */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-3xl md:text-4xl">🥂</div>
    <div className="absolute bottom-4 left-8 text-2xl md:text-3xl">🎉</div>
    <div className="absolute bottom-4 right-8 text-2xl md:text-3xl scale-x-[-1]">🎉</div>
    
    {/* Side Sparklers */}
    <div className="absolute top-1/4 left-4 text-xl opacity-70">🎇</div>
    <div className="absolute top-1/2 left-4 text-xl opacity-70">✨</div>
    <div className="absolute top-3/4 left-4 text-xl opacity-70">🌟</div>
    <div className="absolute top-1/4 right-4 text-xl opacity-70">🎇</div>
    <div className="absolute top-1/2 right-4 text-xl opacity-70">✨</div>
    <div className="absolute top-3/4 right-4 text-xl opacity-70">🌟</div>
    
    {/* Golden Corner Glow */}
    <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-yellow-400/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-amber-400/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-amber-400/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-yellow-400/20 to-transparent rounded-full blur-3xl" />
    
    {/* Golden Frame */}
    <div className="absolute inset-4 border border-yellow-400/20 rounded-lg pointer-events-none" />
  </div>
));
NewYearDecorations.displayName = 'NewYearDecorations';

const BirthdayDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Floating Balloons across page */}
    {[...Array(12)].map((_, i) => (
      <div
        key={`balloon-${i}`}
        className="absolute animate-float-balloon"
        style={{
          left: `${8 + i * 8}%`,
          bottom: `${10 + (i % 4) * 20}%`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${4 + (i % 3)}s`,
          filter: `hue-rotate(${i * 30}deg)`,
        }}
      >
        <span className="text-2xl md:text-3xl">🎈</span>
      </div>
    ))}
    
    {/* Falling Confetti */}
    {[...Array(15)].map((_, i) => (
      <div
        key={`bd-confetti-${i}`}
        className="absolute animate-fall-confetti-slow"
        style={{
          left: `${6 + i * 6}%`,
          top: '-5%',
          animationDuration: `${7 + (i % 4) * 2}s`,
          animationDelay: `${(i % 6) * 1.2}s`,
        }}
      >
        <span className="text-sm md:text-base opacity-50">
          {['🎊', '✨', '⭐', '🎉', '🎀'][i % 5]}
        </span>
      </div>
    ))}
    
    {/* Colorful Top Border */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500/50 via-purple-500/50 to-blue-500/50" />
    <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400/40 via-green-400/40 to-pink-400/40" />
    
    {/* Colorful Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-pink-500/40 via-purple-500/40 to-blue-500/40" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-blue-500/40 via-purple-500/40 to-pink-500/40" />
    
    {/* Birthday Cake Center Bottom */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-3xl md:text-4xl">🎂</div>
    
    {/* Corner Presents */}
    <div className="absolute bottom-4 left-4 text-2xl md:text-3xl">🎁</div>
    <div className="absolute bottom-4 right-4 text-2xl md:text-3xl">🎁</div>
    
    {/* Party Hats */}
    <div className="absolute top-4 left-4 text-2xl md:text-3xl">🥳</div>
    <div className="absolute top-4 right-4 text-2xl md:text-3xl scale-x-[-1]">🥳</div>
    <div className="absolute top-4 left-1/4 text-xl md:text-2xl">🎉</div>
    <div className="absolute top-4 right-1/4 text-xl md:text-2xl scale-x-[-1]">🎉</div>
    
    {/* Side Decorations */}
    <div className="absolute top-1/3 left-4 text-lg opacity-60">🎊</div>
    <div className="absolute top-1/2 left-4 text-lg opacity-60">🎀</div>
    <div className="absolute top-2/3 left-4 text-lg opacity-60">✨</div>
    <div className="absolute top-1/3 right-4 text-lg opacity-60">🎉</div>
    <div className="absolute top-1/2 right-4 text-lg opacity-60">🎀</div>
    <div className="absolute top-2/3 right-4 text-lg opacity-60">✨</div>
    
    {/* Colorful Corner Glow */}
    <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-pink-400/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-purple-400/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-blue-400/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-gradient-radial from-yellow-400/20 to-transparent rounded-full blur-3xl" />
    
    {/* Party Frame */}
    <div className="absolute inset-4 border border-pink-400/15 rounded-lg pointer-events-none" />
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
