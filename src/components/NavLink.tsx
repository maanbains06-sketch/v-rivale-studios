import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { preloadRoute } from "@/lib/routePreloader";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    // Preload route on hover for instant navigation
    const handleMouseEnter = useCallback(() => {
      if (typeof to === 'string') {
        preloadRoute(to);
      }
    }, [to]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
