import { useActiveTheme, ThemeType } from './useActiveTheme';

// Theme image mapping - organized by theme and page
// Each theme has a set of page-specific images, falling back to the home image
const themeImages: Record<ThemeType, Record<string, string>> = {
  default: {},
  winter: {
    home: '/src/assets/themes/winter/header-home.jpg',
    about: '/src/assets/themes/winter/header-about.jpg',
    business: '/src/assets/themes/winter/header-business.jpg',
    community: '/src/assets/themes/winter/header-community.jpg',
    features: '/src/assets/themes/winter/header-features.jpg',
    gallery: '/src/assets/themes/winter/header-gallery.jpg',
    guides: '/src/assets/themes/winter/header-guides.jpg',
    rules: '/src/assets/themes/winter/header-rules.jpg',
    staff: '/src/assets/themes/winter/header-staff.jpg',
    support: '/src/assets/themes/winter/header-support.jpg',
    whitelist: '/src/assets/themes/winter/header-whitelist.jpg',
    gang: '/src/assets/themes/winter/header-gang.jpg',
  },
  christmas: {
    home: '/src/assets/themes/christmas/header-home.jpg',
    about: '/src/assets/themes/christmas/header-about.jpg',
    business: '/src/assets/themes/christmas/header-business.jpg',
    community: '/src/assets/themes/christmas/header-community.jpg',
    features: '/src/assets/themes/christmas/header-features.jpg',
    gallery: '/src/assets/themes/christmas/header-gallery.jpg',
    guides: '/src/assets/themes/christmas/header-guides.jpg',
    rules: '/src/assets/themes/christmas/header-rules.jpg',
    staff: '/src/assets/themes/christmas/header-staff.jpg',
    support: '/src/assets/themes/christmas/header-support.jpg',
    whitelist: '/src/assets/themes/christmas/header-whitelist.jpg',
    gang: '/src/assets/themes/christmas/header-gang.jpg',
  },
  halloween: {
    home: '/src/assets/themes/halloween/header-home.jpg',
    about: '/src/assets/themes/halloween/header-about.jpg',
    business: '/src/assets/themes/halloween/header-business.jpg',
    community: '/src/assets/themes/halloween/header-community.jpg',
    features: '/src/assets/themes/halloween/header-features.jpg',
    gallery: '/src/assets/themes/halloween/header-gallery.jpg',
    guides: '/src/assets/themes/halloween/header-guides.jpg',
    rules: '/src/assets/themes/halloween/header-rules.jpg',
    staff: '/src/assets/themes/halloween/header-staff.jpg',
    support: '/src/assets/themes/halloween/header-support.jpg',
    whitelist: '/src/assets/themes/halloween/header-whitelist.jpg',
    gang: '/src/assets/themes/halloween/header-gang.jpg',
  },
  diwali: {
    home: '/src/assets/themes/diwali/header-home.jpg',
  },
  holi: {
    home: '/src/assets/themes/holi/header-home.jpg',
  },
  new_year: {
    home: '/src/assets/themes/new_year/header-home.jpg',
  },
  birthday: {
    home: '/src/assets/themes/birthday/header-home.jpg',
  },
};

// Dynamic imports for theme images
const themeImageImports: Record<string, Record<string, () => Promise<{ default: string }>>> = {
  winter: {
    home: () => import('@/assets/themes/winter/header-home.jpg'),
    about: () => import('@/assets/themes/winter/header-about.jpg'),
    business: () => import('@/assets/themes/winter/header-business.jpg'),
    community: () => import('@/assets/themes/winter/header-community.jpg'),
    features: () => import('@/assets/themes/winter/header-features.jpg'),
    gallery: () => import('@/assets/themes/winter/header-gallery.jpg'),
    guides: () => import('@/assets/themes/winter/header-guides.jpg'),
    rules: () => import('@/assets/themes/winter/header-rules.jpg'),
    staff: () => import('@/assets/themes/winter/header-staff.jpg'),
    support: () => import('@/assets/themes/winter/header-support.jpg'),
    whitelist: () => import('@/assets/themes/winter/header-whitelist.jpg'),
    gang: () => import('@/assets/themes/winter/header-gang.jpg'),
  },
  christmas: {
    home: () => import('@/assets/themes/christmas/header-home.jpg'),
    about: () => import('@/assets/themes/christmas/header-about.jpg'),
    business: () => import('@/assets/themes/christmas/header-business.jpg'),
    community: () => import('@/assets/themes/christmas/header-community.jpg'),
    features: () => import('@/assets/themes/christmas/header-features.jpg'),
    gallery: () => import('@/assets/themes/christmas/header-gallery.jpg'),
    guides: () => import('@/assets/themes/christmas/header-guides.jpg'),
    rules: () => import('@/assets/themes/christmas/header-rules.jpg'),
    staff: () => import('@/assets/themes/christmas/header-staff.jpg'),
    support: () => import('@/assets/themes/christmas/header-support.jpg'),
    whitelist: () => import('@/assets/themes/christmas/header-whitelist.jpg'),
    gang: () => import('@/assets/themes/christmas/header-gang.jpg'),
  },
  halloween: {
    home: () => import('@/assets/themes/halloween/header-home.jpg'),
    about: () => import('@/assets/themes/halloween/header-about.jpg'),
    business: () => import('@/assets/themes/halloween/header-business.jpg'),
    community: () => import('@/assets/themes/halloween/header-community.jpg'),
    features: () => import('@/assets/themes/halloween/header-features.jpg'),
    gallery: () => import('@/assets/themes/halloween/header-gallery.jpg'),
    guides: () => import('@/assets/themes/halloween/header-guides.jpg'),
    rules: () => import('@/assets/themes/halloween/header-rules.jpg'),
    staff: () => import('@/assets/themes/halloween/header-staff.jpg'),
    support: () => import('@/assets/themes/halloween/header-support.jpg'),
    whitelist: () => import('@/assets/themes/halloween/header-whitelist.jpg'),
    gang: () => import('@/assets/themes/halloween/header-gang.jpg'),
  },
  diwali: {
    home: () => import('@/assets/themes/diwali/header-home.jpg'),
  },
  holi: {
    home: () => import('@/assets/themes/holi/header-home.jpg'),
  },
  new_year: {
    home: () => import('@/assets/themes/new_year/header-home.jpg'),
  },
  birthday: {
    home: () => import('@/assets/themes/birthday/header-home.jpg'),
  },
};

// Cache for loaded images
const imageCache: Record<string, string> = {};

/**
 * Hook to get themed background image for a page
 * @param page - The page identifier (e.g., 'home', 'about', 'business')
 * @param defaultImage - The default image to use when theme is 'default' or image not found
 * @returns The themed image URL or the default image
 */
export function useThemedImage(page: string, defaultImage: string): {
  themedImage: string;
  isLoading: boolean;
  activeTheme: ThemeType;
} {
  const { activeTheme, loading: themeLoading } = useActiveTheme();
  const [themedImage, setThemedImage] = React.useState<string>(defaultImage);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const loadThemedImage = async () => {
      // Use default image when theme is 'default' or loading
      if (activeTheme === 'default' || themeLoading) {
        setThemedImage(defaultImage);
        return;
      }

      const cacheKey = `${activeTheme}-${page}`;
      
      // Check cache first
      if (imageCache[cacheKey]) {
        setThemedImage(imageCache[cacheKey]);
        return;
      }

      // Try to load the themed image
      const themeImports = themeImageImports[activeTheme];
      if (!themeImports) {
        setThemedImage(defaultImage);
        return;
      }

      // Try page-specific image first, then fall back to home image
      const importFn = themeImports[page] || themeImports['home'];
      if (!importFn) {
        setThemedImage(defaultImage);
        return;
      }

      setIsLoading(true);
      try {
        const module = await importFn();
        imageCache[cacheKey] = module.default;
        setThemedImage(module.default);
      } catch (error) {
        console.warn(`Failed to load themed image for ${activeTheme}/${page}:`, error);
        // Try home image as fallback
        if (page !== 'home' && themeImports['home']) {
          try {
            const homeModule = await themeImports['home']();
            imageCache[cacheKey] = homeModule.default;
            setThemedImage(homeModule.default);
          } catch {
            setThemedImage(defaultImage);
          }
        } else {
          setThemedImage(defaultImage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadThemedImage();
  }, [activeTheme, page, defaultImage, themeLoading]);

  return { themedImage, isLoading, activeTheme };
}

import React from 'react';
