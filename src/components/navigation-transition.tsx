"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MINIMUM_TRANSITION_MS = 1050;

export function HouseLoader({ overlay = false }: { overlay?: boolean }) {
  return (
    <div
      className={overlay ? "route-loader route-loader-overlay" : "route-loader"}
      role="status"
      aria-live="polite"
      aria-label="Building your next page"
    >
      <div className="route-loader-glow" aria-hidden="true" />
      <div className="house-build" aria-hidden="true">
        <svg viewBox="0 0 240 210" focusable="false">
          <path className="house-ground" d="M28 181H212" />
          <g className="house-walls">
            <path className="house-fill" d="M58 92h124v89H58z" />
            <path d="M58 92v89h124V92" />
          </g>
          <g className="house-window">
            <rect x="78" y="116" width="36" height="31" rx="3" />
            <path d="M96 116v31M78 131.5h36" />
          </g>
          <g className="house-door">
            <path d="M135 181v-54h27v54" />
            <circle cx="155" cy="154" r="2" />
          </g>
          <g className="house-roof">
            <path className="roof-fill" d="M43 96 120 35l77 61-13 16-64-50-64 50z" />
            <path d="M43 96 120 35l77 61" />
            <path className="house-chimney" d="M158 60V35h18v39" />
          </g>
          <g className="house-spark">
            <path d="m205 54 9-9M210 67h13M197 45V32" />
          </g>
        </svg>
        <span className="build-orbit"><span /></span>
      </div>
      <p>Building your next page<span className="loader-dots" aria-hidden="true"><i /><i /><i /></span></p>
      <small>Good work takes a second</small>
    </div>
  );
}

export function NavigationTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [visible, setVisible] = useState(false);
  const startedAt = useRef(0);
  const routeAtStart = useRef("");
  const currentRoute = useRef(routeKey);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a ref mirror of the latest route for the popstate handler below,
  // whose closure is registered once (effect deps: []) and would otherwise
  // only ever see the route at mount. Refs can't be written during render.
  useEffect(() => {
    currentRoute.current = routeKey;
  }, [routeKey]);

  useEffect(() => {
    function beginTransition(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (destination.origin !== current.origin) return;
      if (destination.pathname === current.pathname && destination.search === current.search) return;

      if (hideTimer.current) clearTimeout(hideTimer.current);
      startedAt.current = performance.now();
      routeAtStart.current = `${current.pathname}?${current.searchParams.toString()}`;
      setVisible(true);
    }

    function beginHistoryTransition() {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      startedAt.current = performance.now();
      routeAtStart.current = currentRoute.current;
      setVisible(true);
    }

    document.addEventListener("click", beginTransition);
    window.addEventListener("popstate", beginHistoryTransition);
    return () => {
      document.removeEventListener("click", beginTransition);
      window.removeEventListener("popstate", beginHistoryTransition);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const elapsed = performance.now() - startedAt.current;
    const routeHasChanged = routeKey !== routeAtStart.current;
    hideTimer.current = setTimeout(
      () => setVisible(false),
      routeHasChanged ? Math.max(MINIMUM_TRANSITION_MS - elapsed, 140) : 8000,
    );
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [routeKey, visible]);

  return (
    <div className="navigation-transition" data-visible={visible} aria-hidden={!visible}>
      <HouseLoader overlay />
    </div>
  );
}
