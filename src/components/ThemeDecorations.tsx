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
    
    {/* Top Border Decoration */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
    <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
    
    {/* Bottom Border Decoration */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
    <div className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
    
    {/* Side Border Decorations */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
    
    {/* Rangoli Corners */}
    <div className="absolute top-12 left-12 text-2xl md:text-3xl opacity-60">🌸</div>
    <div className="absolute top-12 right-12 text-2xl md:text-3xl opacity-60">🌸</div>
    <div className="absolute bottom-12 left-12 text-2xl md:text-3xl opacity-60">🌸</div>
    <div className="absolute bottom-12 right-12 text-2xl md:text-3xl opacity-60">🌸</div>
    
    {/* Subtle Corner Glow */}
    <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-amber-500/20 to-transparent rounded-full blur-xl" />
    <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-orange-500/20 to-transparent rounded-full blur-xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-orange-500/20 to-transparent rounded-full blur-xl" />
    <div className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-amber-500/20 to-transparent rounded-full blur-xl" />
    
    {/* Decorative Border Frame */}
    <div className="absolute inset-4 border-2 border-amber-500/20 rounded-lg pointer-events-none" />
  </div>
));
DiwaliDecorations.displayName = 'DiwaliDecorations';

const HoliDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Corner Color Splashes */}
    <div className="absolute top-0 left-0 w-24 h-24 md:w-40 md:h-40 bg-gradient-radial from-pink-500/30 to-transparent rounded-full blur-2xl" />
    <div className="absolute top-0 right-0 w-24 h-24 md:w-40 md:h-40 bg-gradient-radial from-green-500/30 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-24 h-24 md:w-40 md:h-40 bg-gradient-radial from-yellow-500/30 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 right-0 w-24 h-24 md:w-40 md:h-40 bg-gradient-radial from-purple-500/30 to-transparent rounded-full blur-2xl" />
    
    {/* Rainbow Top Border */}
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500/60 via-yellow-500/60 to-green-500/60" />
    <div className="absolute top-1.5 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/40 via-orange-500/40 to-cyan-500/40" />
    
    {/* Rainbow Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500/60 via-yellow-500/60 to-pink-500/60" />
    <div className="absolute bottom-1.5 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/40 via-orange-500/40 to-purple-500/40" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-pink-500/50 via-yellow-500/50 to-green-500/50" />
    <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-gradient-to-b from-green-500/50 via-yellow-500/50 to-pink-500/50" />
    
    {/* Corner Emojis */}
    <div className="absolute top-4 left-4 text-2xl md:text-3xl">💥</div>
    <div className="absolute top-4 right-4 text-2xl md:text-3xl">💥</div>
    <div className="absolute bottom-4 left-4 text-2xl md:text-3xl">🎨</div>
    <div className="absolute bottom-4 right-4 text-2xl md:text-3xl">🎨</div>
    
    {/* Decorative Frame */}
    <div className="absolute inset-3 border-2 border-dashed border-pink-400/20 rounded-xl pointer-events-none" />
  </div>
));
HoliDecorations.displayName = 'HoliDecorations';

const HalloweenDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
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
    
    {/* Bats on sides */}
    <div className="absolute top-1/4 left-4 text-xl md:text-2xl opacity-60">🦇</div>
    <div className="absolute top-1/3 right-4 text-xl md:text-2xl opacity-60">🦇</div>
    
    {/* Ghosts */}
    <div className="absolute top-1/2 left-4 text-xl md:text-2xl opacity-40">👻</div>
    <div className="absolute top-2/3 right-4 text-xl md:text-2xl opacity-40">👻</div>
    
    {/* Spooky Corner Glow */}
    <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-purple-600/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-orange-600/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-orange-600/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-purple-600/15 to-transparent rounded-full blur-2xl" />
    
    {/* Decorative Frame */}
    <div className="absolute inset-4 border-2 border-orange-500/15 rounded-lg pointer-events-none" />
  </div>
));
HalloweenDecorations.displayName = 'HalloweenDecorations';

const WinterDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Frost Top Border */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent" />
    <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    
    {/* Frost Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent" />
    <div className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    
    {/* Frost Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-transparent via-sky-300/40 to-transparent" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-transparent via-sky-300/40 to-transparent" />
    
    {/* Corner Snowflakes */}
    <div className="absolute top-4 left-4 text-3xl md:text-4xl opacity-70">❄️</div>
    <div className="absolute top-4 right-4 text-3xl md:text-4xl opacity-70">❄️</div>
    <div className="absolute bottom-4 left-4 text-3xl md:text-4xl opacity-70">❄️</div>
    <div className="absolute bottom-4 right-4 text-3xl md:text-4xl opacity-70">❄️</div>
    
    {/* Side Snowflakes */}
    <div className="absolute top-1/3 left-4 text-xl md:text-2xl opacity-50">❄️</div>
    <div className="absolute top-2/3 left-4 text-xl md:text-2xl opacity-50">❄️</div>
    <div className="absolute top-1/3 right-4 text-xl md:text-2xl opacity-50">❄️</div>
    <div className="absolute top-2/3 right-4 text-xl md:text-2xl opacity-50">❄️</div>
    
    {/* Gentle Falling Snow - Only 6 snowflakes */}
    {[...Array(6)].map((_, i) => (
      <div
        key={`snow-${i}`}
        className="absolute animate-fall-snow-slow"
        style={{
          left: `${15 + i * 15}%`,
          top: '-5%',
          animationDuration: `${12 + i * 3}s`,
          animationDelay: `${i * 2}s`,
          fontSize: '14px',
          opacity: 0.4,
        }}
      >
        ❄️
      </div>
    ))}
    
    {/* Corner Frost Glow */}
    <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-sky-300/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-sky-300/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-sky-300/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-sky-300/15 to-transparent rounded-full blur-2xl" />
    
    {/* Frost Frame */}
    <div className="absolute inset-4 border border-sky-300/20 rounded-lg pointer-events-none" />
  </div>
));
WinterDecorations.displayName = 'WinterDecorations';

const ChristmasDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Christmas Lights Top Border */}
    <div className="absolute top-0 left-0 right-0 flex justify-around py-1">
      {[...Array(12)].map((_, i) => (
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
    
    {/* Red & Green Border */}
    <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-red-500/40 via-green-500/40 to-red-500/40" />
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-600/50 via-red-600/50 to-green-600/50" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-red-500/40 via-green-500/40 to-red-500/40" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-green-500/40 via-red-500/40 to-green-500/40" />
    
    {/* Corner Christmas Trees */}
    <div className="absolute bottom-4 left-4 text-3xl md:text-4xl">🎄</div>
    <div className="absolute bottom-4 right-4 text-3xl md:text-4xl">🎄</div>
    
    {/* Corner Presents */}
    <div className="absolute bottom-4 left-16 text-2xl md:text-3xl">🎁</div>
    <div className="absolute bottom-4 right-16 text-2xl md:text-3xl">🎁</div>
    
    {/* Top Star */}
    <div className="absolute top-10 left-1/2 -translate-x-1/2 text-2xl md:text-3xl animate-pulse">⭐</div>
    
    {/* Side Ornaments */}
    <div className="absolute top-1/3 left-4 text-xl opacity-60">🎅</div>
    <div className="absolute top-1/2 right-4 text-xl opacity-60">☃️</div>
    
    {/* Gentle Snow - Only 4 */}
    {[...Array(4)].map((_, i) => (
      <div
        key={`xmas-snow-${i}`}
        className="absolute animate-fall-snow-slow"
        style={{
          left: `${20 + i * 20}%`,
          top: '-5%',
          animationDuration: `${15 + i * 3}s`,
          animationDelay: `${i * 3}s`,
          fontSize: '12px',
          opacity: 0.3,
        }}
      >
        ❄️
      </div>
    ))}
    
    {/* Festive Corner Glow */}
    <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-red-500/10 to-transparent rounded-full blur-2xl" />
    <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-green-500/10 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-green-500/10 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-red-500/10 to-transparent rounded-full blur-2xl" />
    
    {/* Festive Frame */}
    <div className="absolute inset-4 border border-green-500/15 rounded-lg pointer-events-none" />
  </div>
));
ChristmasDecorations.displayName = 'ChristmasDecorations';

const NewYearDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Golden Top Border */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
    <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
    
    {/* Golden Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
    <div className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent" />
    
    {/* Corner Fireworks */}
    <div className="absolute top-4 left-4 text-2xl md:text-3xl animate-pulse">🎆</div>
    <div className="absolute top-4 right-4 text-2xl md:text-3xl animate-pulse" style={{ animationDelay: '0.5s' }}>🎆</div>
    <div className="absolute top-16 left-16 text-xl md:text-2xl animate-pulse opacity-70" style={{ animationDelay: '1s' }}>🎇</div>
    <div className="absolute top-16 right-16 text-xl md:text-2xl animate-pulse opacity-70" style={{ animationDelay: '1.5s' }}>🎇</div>
    
    {/* Bottom Celebration */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-3xl md:text-4xl">🥂</div>
    <div className="absolute bottom-4 left-8 text-2xl md:text-3xl">🎉</div>
    <div className="absolute bottom-4 right-8 text-2xl md:text-3xl scale-x-[-1]">🎉</div>
    
    {/* Side Party Elements */}
    <div className="absolute top-1/3 left-4 text-xl opacity-60">✨</div>
    <div className="absolute top-1/2 right-4 text-xl opacity-60">✨</div>
    <div className="absolute top-2/3 left-4 text-xl opacity-60">🌟</div>
    
    {/* Gentle Confetti - Only 5 */}
    {[...Array(5)].map((_, i) => (
      <div
        key={`confetti-${i}`}
        className="absolute animate-fall-confetti-slow"
        style={{
          left: `${15 + i * 18}%`,
          top: '-5%',
          animationDuration: `${8 + i * 2}s`,
          animationDelay: `${i * 2}s`,
        }}
      >
        <span className="text-sm opacity-50">
          {['🎊', '✨', '🌟'][i % 3]}
        </span>
      </div>
    ))}
    
    {/* Golden Corner Glow */}
    <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-yellow-400/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-amber-400/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-amber-400/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-yellow-400/15 to-transparent rounded-full blur-2xl" />
    
    {/* Golden Frame */}
    <div className="absolute inset-4 border border-yellow-400/20 rounded-lg pointer-events-none" />
  </div>
));
NewYearDecorations.displayName = 'NewYearDecorations';

const BirthdayDecorations = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
    {/* Colorful Top Border */}
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500/50 via-purple-500/50 to-blue-500/50" />
    <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400/40 via-green-400/40 to-pink-400/40" />
    
    {/* Colorful Bottom Border */}
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50" />
    <div className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-pink-400/40 via-green-400/40 to-yellow-400/40" />
    
    {/* Side Borders */}
    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-pink-500/40 via-purple-500/40 to-blue-500/40" />
    <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-blue-500/40 via-purple-500/40 to-pink-500/40" />
    
    {/* Corner Balloons */}
    <div className="absolute top-4 left-4 text-2xl md:text-3xl">🎈</div>
    <div className="absolute top-4 right-4 text-2xl md:text-3xl" style={{ filter: 'hue-rotate(60deg)' }}>🎈</div>
    <div className="absolute top-12 left-12 text-xl md:text-2xl opacity-70" style={{ filter: 'hue-rotate(120deg)' }}>🎈</div>
    <div className="absolute top-12 right-12 text-xl md:text-2xl opacity-70" style={{ filter: 'hue-rotate(180deg)' }}>🎈</div>
    
    {/* Birthday Cake Center Bottom */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-3xl md:text-4xl">🎂</div>
    
    {/* Corner Presents */}
    <div className="absolute bottom-4 left-16 text-2xl md:text-3xl">🎁</div>
    <div className="absolute bottom-4 right-16 text-2xl md:text-3xl">🎁</div>
    
    {/* Party Hats */}
    <div className="absolute top-4 left-1/4 text-xl md:text-2xl">🥳</div>
    <div className="absolute top-4 right-1/4 text-xl md:text-2xl scale-x-[-1]">🥳</div>
    
    {/* Side Decorations */}
    <div className="absolute top-1/3 left-4 text-lg opacity-60">🎊</div>
    <div className="absolute top-1/2 right-4 text-lg opacity-60">🎉</div>
    <div className="absolute top-2/3 left-4 text-lg opacity-60">✨</div>
    
    {/* Gentle Confetti - Only 4 */}
    {[...Array(4)].map((_, i) => (
      <div
        key={`bd-confetti-${i}`}
        className="absolute animate-fall-confetti-slow"
        style={{
          left: `${20 + i * 20}%`,
          top: '-5%',
          animationDuration: `${10 + i * 2}s`,
          animationDelay: `${i * 2.5}s`,
        }}
      >
        <span className="text-sm opacity-40">
          {['🎊', '✨', '⭐', '🎉'][i % 4]}
        </span>
      </div>
    ))}
    
    {/* Colorful Corner Glow */}
    <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-pink-400/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-purple-400/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-blue-400/15 to-transparent rounded-full blur-2xl" />
    <div className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-radial from-yellow-400/15 to-transparent rounded-full blur-2xl" />
    
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
