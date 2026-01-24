// Route preloader for faster navigation
// Preloads route chunks on hover/focus for instant navigation

const preloadedRoutes = new Set<string>();

// Map of route paths to their lazy import functions
const routeImports: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/Index'),
  '/about': () => import('@/pages/About'),
  '/features': () => import('@/pages/Features'),
  '/rules': () => import('@/pages/Rules'),
  '/community': () => import('@/pages/Community'),
  '/whitelist': () => import('@/pages/Whitelist'),
  '/staff': () => import('@/pages/Staff'),
  '/guides': () => import('@/pages/Guides'),
  '/gallery': () => import('@/pages/Gallery'),
  '/support': () => import('@/pages/Support'),
  '/auth': () => import('@/pages/Auth'),
  '/dashboard': () => import('@/pages/Dashboard'),
  '/giveaway': () => import('@/pages/Giveaway'),
  '/business': () => import('@/pages/Business'),
  '/gang-rp': () => import('@/pages/GangRP'),
  '/feedback': () => import('@/pages/Feedback'),
  '/job-application': () => import('@/pages/JobApplication'),
};

// Preload a route's chunk
export const preloadRoute = (path: string): void => {
  // Normalize path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = normalizedPath.split('?')[0]; // Remove query params
  
  if (preloadedRoutes.has(basePath)) return;
  
  const importFn = routeImports[basePath];
  if (importFn) {
    preloadedRoutes.add(basePath);
    // Use requestIdleCallback for non-blocking preload
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => importFn(), { timeout: 2000 });
    } else {
      setTimeout(() => importFn(), 100);
    }
  }
};

// Preload critical routes on app start
export const preloadCriticalRoutes = (): void => {
  // Preload most visited routes after initial load
  const criticalRoutes = ['/', '/about', '/features', '/rules', '/staff'];
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      criticalRoutes.forEach((route, index) => {
        setTimeout(() => preloadRoute(route), index * 100);
      });
    }, { timeout: 3000 });
  } else {
    setTimeout(() => {
      criticalRoutes.forEach((route, index) => {
        setTimeout(() => preloadRoute(route), index * 150);
      });
    }, 1000);
  }
};

// Hook for preloading on link hover
export const useRoutePreload = () => {
  const handleMouseEnter = (path: string) => {
    preloadRoute(path);
  };
  
  return { preloadRoute: handleMouseEnter };
};
