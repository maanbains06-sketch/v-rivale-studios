import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook to defer non-critical operations until the browser is idle
 */
export const useIdleCallback = (callback: () => void, timeout = 2000) => {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(callback, { timeout });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 100);
      return () => clearTimeout(id);
    }
  }, [callback, timeout]);
};

/**
 * Hook to detect if user prefers reduced motion
 */
export const usePrefersReducedMotion = () => {
  const query = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)') 
    : null;
  return query?.matches ?? false;
};

/**
 * Hook to detect if device is likely low-powered (mobile/tablet)
 */
export const useIsLowPowerDevice = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for mobile/tablet
  const isMobile = window.innerWidth < 768;
  
  // Check for reduced motion preference (often set on older devices)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check hardware concurrency (CPU cores)
  const lowCores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
  
  return isMobile || prefersReducedMotion || lowCores;
};

/**
 * Hook to throttle a callback
 */
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = delay - (now - lastCall.current);

      if (remaining <= 0) {
        lastCall.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          timeoutRef.current = undefined;
          callback(...args);
        }, remaining);
      }
    }) as T,
    [callback, delay]
  );
};

/**
 * Hook to debounce a value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
