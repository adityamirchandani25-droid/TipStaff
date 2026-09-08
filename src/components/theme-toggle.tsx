"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Avoid a hydration mismatch: the resolved theme isn't known until after
  // mount (it can depend on localStorage / matchMedia), so render nothing
  // interactive on the server pass.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Standard next-themes hydration-safety pattern: resolved theme is
    // unknown server-side, so the first client render must match the
    // server's, and only flip to the real value once mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Color theme">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mounted && theme === value}
          aria-label={label}
          title={label}
          disabled={!mounted}
          onClick={() => setTheme(value)}
          className={mounted && theme === value ? "active" : ""}
        >
          <Icon size={13} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
