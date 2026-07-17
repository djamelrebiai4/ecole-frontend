"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = "ecole-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const setResolved = useCallback((t: Theme) => {
    setResolvedTheme(resolveTheme(t));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
    setResolved(t);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  }, [theme, setTheme]);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored) {
      setThemeState(stored);
      setResolvedTheme(resolveTheme(stored));
    } else {
      setResolvedTheme(getSystemTheme());
    }
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, mounted]);

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "system", resolvedTheme: "light", setTheme: () => {}, toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Theme Toggle Button Component
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const icons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const labels: Record<Theme, string> = {
    light: "فاتح",
    dark: "داكن",
    system: "النظام",
  };

  return (
    <div className="relative inline-flex items-center" role="group" aria-label="تغيير المظهر">
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface
          px-3 py-1.5 text-sm font-medium text-fg transition-all
          hover:border-primary hover:text-primary
          focus:outline-none focus:ring-2 focus:ring-primary/20
          ${className || ""}
        `}
        aria-label={`المظهر الحالي: ${labels[theme]}. اضغط للتغيير.`}
      >
        {icons[theme]}
        <span className="hidden sm:inline">{labels[theme]}</span>
      </button>

      {/* Dropdown Menu */}
      <ThemeDropdown theme={theme} setTheme={setTheme} />
    </div>
  );
}

function ThemeDropdown({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "فاتح", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "داكن", icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "النظام", icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div ref={ref} className="relative">
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-full z-50 mt-1.5 w-40 rounded-lg border border-border bg-surface shadow-lg py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  theme === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-fg hover:bg-bg"
                }`}
              >
                <span className="flex h-4 w-4">{opt.icon}</span>
                {opt.label}
                {theme === opt.value && <span className="ms-auto text-primary">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}