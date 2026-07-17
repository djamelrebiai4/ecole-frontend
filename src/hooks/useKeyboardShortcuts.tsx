"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { Search, Keyboard, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  global?: boolean;
  category?: string;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
  category?: string;
  shortcut?: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const ref = useRef<Shortcut[]>(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const pressedKey = e.key.toLowerCase();
      const isMac = navigator.platform.toUpperCase().includes("MAC");

      for (const shortcut of ref.current) {
        const requiredKey = shortcut.key.toLowerCase();
        const match = (
          (shortcut.key === "mod" && (isMac ? e.metaKey : e.ctrlKey)) ||
          (shortcut.key === "shift" && e.shiftKey) ||
          (shortcut.key === "alt" && e.altKey) ||
          (pressedKey === requiredKey)
        );

        // Check for combinations like "mod+k"
        if (shortcut.key.includes("+")) {
          const parts = shortcut.key.toLowerCase().split("+");
          const modPressed = parts.includes("mod") ? (isMac ? e.metaKey : e.ctrlKey) : true;
          const shiftPressed = parts.includes("shift") ? e.shiftKey : true;
          const altPressed = parts.includes("alt") ? e.altKey : true;
          const keyPressed = parts.find(p => !["mod", "shift", "alt"].includes(p));

          if (modPressed && shiftPressed && altPressed && keyPressed === pressedKey) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        } else if (match && (shortcut.global || !target.closest("input, textarea, select, [contenteditable]"))) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const registerCommands = useCallback((newItems: CommandItem[]) => {
    setItems(newItems);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Filter items based on query
  const filteredItems = items
    .map((item, index) => ({
      ...item,
      score: calculateScore(item, query),
      originalIndex: index,
    }))
    .filter(item => item.score > 0 || query === "")
    .sort((a, b) => b.score - a.score);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
  }, [open, query]);

  useEffect(() => {
    if (!open || filteredItems.length === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          const selected = filteredItems[selectedIndex];
          if (selected) {
            selected.action();
            closePalette();
          }
          break;
        case "Escape":
          closePalette();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredItems, selectedIndex, closePalette]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIndex] as HTMLElement;
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, filteredItems]);

  return {
    open,
    query,
    setQuery,
    selectedIndex,
    filteredItems,
    openPalette,
    closePalette,
    registerCommands,
    inputRef,
    listRef,
  };
}

function calculateScore(item: CommandItem, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const label = item.label.toLowerCase();
  const desc = item.description?.toLowerCase() || "";
  const keywords = item.keywords?.join(" ").toLowerCase() || "";
  const allText = `${label} ${desc} ${keywords}`;

  if (allText === q) return 100;
  if (label.startsWith(q)) return 90;
  if (label.includes(q)) return 70;
  if (desc.includes(q)) return 50;
  if (keywords.includes(q)) return 40;
  // Fuzzy match
  let score = 0;
  let idx = 0;
  for (const char of q) {
    idx = allText.indexOf(char, idx);
    if (idx === -1) return 0;
    score += 10 - idx;
    idx++;
  }
  return Math.max(score, 1);
}

export function CommandPalette() {
  const {
    open,
    query,
    setQuery,
    selectedIndex,
    filteredItems,
    inputRef,
    listRef,
    closePalette,
  } = useCommandPalette();
  const t = useTranslations("commandPalette");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closePalette} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 bg-transparent text-fg placeholder:text-muted outline-none text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-xs text-muted">
            <Keyboard className="h-3 w-3" />
            <span>Esc</span>
          </kbd>
        </div>

        <ul
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto"
          role="listbox"
          aria-label={t("results")}
        >
          {filteredItems.length === 0 ? (
            <li className="px-4 py-8 text-center text-muted">
              {query ? t("noResults") : t("typeToSearch")}
            </li>
          ) : (
            filteredItems.map((item, index) => (
              <li
                key={item.id}
                role="option"
                aria-selected={index === selectedIndex}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  index === selectedIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-bg"
                )}
                onClick={() => { item.action(); closePalette(); }}
              >
                {item.icon && <span className="flex h-5 w-5 shrink-0">{item.icon}</span>}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.label}</p>
                  {item.description && <p className="text-xs text-muted truncate">{item.description}</p>}
                </div>
                {item.shortcut && (
                  <kbd className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-[10px] text-muted">
                    {item.shortcut}
                  </kbd>
                )}
              </li>
            )))}
        </ul>
      </div>
    </div>
  );
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("keyboardShortcuts");

  const shortcuts: { category: string; items: { keys: string; description: string }[] }[] = [
    {
      category: t("categories.navigation"),
      items: [
        { keys: "G D", description: t("goToDashboard") },
        { keys: "G S", description: t("goToStudents") },
        { keys: "G C", description: t("goToClasses") },
        { keys: "G F", description: t("goToFinance") },
        { keys: "G A", description: t("goToAttendance") },
        { keys: "G T", description: t("goToTimetable") },
      ],
    },
    {
      category: t("categories.actions"),
      items: [
        { keys: "N", description: t("newStudent") },
        { keys: "Mod+N", description: t("newPayment") },
        { keys: "Mod+Shift+N", description: t("newClass") },
        { keys: "/", description: t("search") },
        { keys: "Mod+K", description: t("commandPalette") },
      ],
    },
    {
      category: t("categories.ui"),
      items: [
        { keys: "Mod+D", description: t("toggleDarkMode") },
        { keys: "Mod+L", description: t("toggleLanguage") },
        { keys: "?", description: t("showShortcuts") },
        { keys: "Esc", description: t("closeModals") },
      ],
    },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted transition-all hover:border-primary hover:text-primary"
        aria-label={t("showShortcuts")}
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">{t("showShortcuts")}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[80vh] rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold">{t("title")}</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg">
                <span className="sr-only">{t("close")}</span>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {shortcuts.map(({ category, items }) => (
                <div key={category} className="mb-6">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{category}</h3>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                    {items.map(({ keys, description }) => (
                      <div key={keys} className="flex items-center gap-3">
                        <kbd className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-xs font-mono text-fg">
                          {keys.split("+").map((k, i) => (
                            <span key={i} className={i > 0 ? "text-muted" : ""}>{k}</span>
                          ))}
                        </kbd>
                        <dd className="text-sm text-fg">{description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </>
    );
  }