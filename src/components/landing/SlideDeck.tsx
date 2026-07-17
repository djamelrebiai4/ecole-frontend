"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import "./slide-deck.css";

export default function SlideDeck() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const pathname = usePathname();
  const deckRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const total = 11;

  useEffect(() => {
    const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
    const initial = prefersLight ? "light" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-deck-theme", initial);
    document.body.style.background = "var(--deck-bg)";
    document.body.style.color = "var(--deck-text)";
    return () => {
      document.documentElement.removeAttribute("data-deck-theme");
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-deck-theme", next);
      return next;
    });
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const slides = deck.querySelectorAll<HTMLElement>(".slide");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const idx = Array.from(slides).indexOf(entry.target as HTMLElement);
            setCurrent(idx);
            if (history.replaceState) history.replaceState(null, "", `#/${idx + 1}`);
          }
        });
      },
      { threshold: 0.5 }
    );
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const slides = deck.querySelectorAll<HTMLElement>(".slide");
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (["ArrowDown", "ArrowRight", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        slides[Math.min(current + 1, total - 1)]?.scrollIntoView({ behavior: "smooth" });
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        slides[Math.max(current - 1, 0)]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "Home") { e.preventDefault(); slides[0]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "End") { e.preventDefault(); slides[total - 1]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "t" || e.key === "T") { toggleTheme(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [current, toggleTheme, total]);

  useEffect(() => {
    const m = location.hash.match(/^#\/(\d+)$/);
    if (m) {
      const i = parseInt(m[1], 10) - 1;
      if (i >= 0 && i < total) {
        setTimeout(() => {
          deckRef.current?.querySelectorAll<HTMLElement>(".slide")[i]?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
        }, 100);
      }
    }
  }, [total]);

  const goTo = useCallback((i: number) => {
    deckRef.current?.querySelectorAll<HTMLElement>(".slide")[Math.max(0, Math.min(i, total - 1))]?.scrollIntoView({ behavior: "smooth" });
  }, [total]);

  const otherLocale = locale === "en" ? "ar" : "en";
  const otherLabel = locale === "en" ? "AR" : "عر";

  return (
    <>
      <div className="deck-progress" style={{ width: `${((current + 1) / total) * 100}%` }} />
      <div className="deck-dots">
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} className={`deck-dot ${i === current ? "active" : ""}`} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
      <div className="deck-counter">{current + 1} / {total}</div>
      <button className="deck-theme-btn" onClick={toggleTheme}>◐ {theme}</button>
      <Link href={pathname} locale={otherLocale} className="deck-lang-btn">{otherLabel}</Link>
      <div className="deck-hints">← → space to navigate · T theme</div>

      <div className="deck" ref={deckRef}>

        {/* ===== SLIDE 1: TITLE ===== */}
        <section className="slide slide--title">
          <svg className="slide__decor" style={{ top: 0, right: 0 }} width="120" height="120" viewBox="0 0 120 120">
            <line x1="120" y1="0" x2="120" y2="40" stroke="var(--deck-accent)" strokeWidth="2" opacity="0.15" />
            <line x1="80" y1="0" x2="120" y2="0" stroke="var(--deck-accent)" strokeWidth="2" opacity="0.15" />
          </svg>
          <svg className="slide__decor" style={{ bottom: 0, left: 0 }} width="120" height="120" viewBox="0 0 120 120">
            <line x1="0" y1="80" x2="0" y2="120" stroke="var(--deck-accent)" strokeWidth="2" opacity="0.15" />
            <line x1="0" y1="120" x2="40" y2="120" stroke="var(--deck-accent)" strokeWidth="2" opacity="0.15" />
          </svg>
          <div className="reveal-item">
            <p className="slide__subtitle" style={{ marginBottom: "clamp(16px,2vh,32px)" }}>{t("badge")}</p>
          </div>
          <h1 className="slide__display reveal-item">{t("title")}</h1>
          <div className="reveal-item">
            <p className="slide__subtitle" style={{ marginTop: "clamp(16px,2vh,32px)", maxWidth: 640 }}>{t("subtitle")}</p>
          </div>
          <div className="reveal-item" style={{ marginTop: "clamp(24px,4vh,48px)", display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/auth/login" className="deck-cta deck-cta--primary">{t("cta_start")} →</a>
            <a href="/auth/login" className="deck-cta deck-cta--outline">{t("cta_demo")}</a>
          </div>
        </section>

        {/* ===== SLIDE 2: TOC ===== */}
        <section className="slide slide--toc">
          <p className="slide__label reveal-item">{t("toc_label")}</p>
          <h2 className="slide__heading reveal-item">{t("toc_title")}</h2>
          <ol className="slide__toc">
            <li className="reveal-item"><span className="slide__toc-num">01</span> {t("toc_1")} <span className="slide__toc-hint">{t("toc_hint_1")}</span></li>
            <li className="reveal-item"><span className="slide__toc-num">02</span> {t("toc_2")} <span className="slide__toc-hint">{t("toc_hint_2")}</span></li>
            <li className="reveal-item"><span className="slide__toc-num">03</span> {t("toc_3")} <span className="slide__toc-hint">{t("toc_hint_3")}</span></li>
            <li className="reveal-item"><span className="slide__toc-num">04</span> {t("toc_4")} <span className="slide__toc-hint">{t("toc_hint_4")}</span></li>
            <li className="reveal-item"><span className="slide__toc-num">05</span> {t("toc_5")} <span className="slide__toc-hint">{t("toc_hint_5")}</span></li>
          </ol>
        </section>

        {/* ===== SLIDE 3: DIVIDER — THE NUMBERS ===== */}
        <section className="slide slide--divider" style={{ backgroundImage: "radial-gradient(ellipse at 80% 60%, var(--deck-accent-dim) 0%, transparent 40%)" }}>
          <span className="slide__number">01</span>
          <div>
            <h2 className="slide__heading reveal-item">{t("divider_1")}</h2>
            <p className="slide__subtitle reveal-item" style={{ marginTop: 12 }}>{t("divider_1_sub")}</p>
          </div>
        </section>

        {/* ===== SLIDE 4: DASHBOARD / KPI ===== */}
        <section className="slide slide--dashboard" style={{ backgroundImage: "radial-gradient(ellipse at 70% 30%, var(--deck-accent-dim) 0%, transparent 40%)" }}>
          <p className="slide__label reveal-item">01 · {t("kpi_label")}</p>
          <h2 className="slide__heading reveal-item" style={{ marginBottom: "clamp(12px,2vh,28px)" }}>{t("kpi_title")}</h2>
          <div className="slide__kpis">
            {[
              { val: "24", labelKey: "kpi_1", trendKey: "kpi_1_trend", color: "var(--deck-accent)" },
              { val: "2,847", labelKey: "kpi_2", trendKey: "kpi_2_trend", color: "var(--deck-green)" },
              { val: "124", labelKey: "kpi_3", trendKey: "kpi_3_trend", color: "var(--deck-blue)" },
              { val: "$38.4K", labelKey: "kpi_4", trendKey: "kpi_4_trend", color: "var(--deck-accent)" },
            ].map((k, i) => (
              <div key={i} className="slide__kpi reveal-item">
                <div className="slide__kpi-val" style={{ color: k.color }}>{k.val}</div>
                <div className="slide__kpi-label">{t(k.labelKey)}</div>
                <div className="slide__kpi-trend" style={{ color: "var(--deck-green)" }}>{t(k.trendKey)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== SLIDE 5: DIVIDER — THE SOLUTION ===== */}
        <section className="slide slide--divider" style={{ backgroundImage: "radial-gradient(ellipse at 30% 40%, var(--deck-accent-dim) 0%, transparent 40%)" }}>
          <span className="slide__number">02</span>
          <div>
            <h2 className="slide__heading reveal-item">{t("divider_2")}</h2>
            <p className="slide__subtitle reveal-item" style={{ marginTop: 12 }}>{t("divider_2_sub")}</p>
          </div>
        </section>

        {/* ===== SLIDE 6: SPLIT — BEFORE vs AFTER ===== */}
        <section className="slide slide--split">
          <div className="slide__panels">
            <div className="slide__panel slide__panel--primary">
              <p className="slide__label reveal-item" style={{ color: "var(--deck-red)" }}>{t("split_before_label")}</p>
              <h2 className="slide__heading reveal-item" style={{ fontSize: "clamp(22px,3.5vw,36px)" }}>{t("split_before_title")}</h2>
              <ul className="slide__bullets" style={{ marginTop: 16 }}>
                <li className="reveal-item">{t("split_before_1")}</li>
                <li className="reveal-item">{t("split_before_2")}</li>
                <li className="reveal-item">{t("split_before_3")}</li>
                <li className="reveal-item">{t("split_before_4")}</li>
              </ul>
            </div>
            <div className="slide__panel slide__panel--secondary">
              <p className="slide__label reveal-item" style={{ color: "var(--deck-green)" }}>{t("split_after_label")}</p>
              <h2 className="slide__heading reveal-item" style={{ fontSize: "clamp(22px,3.5vw,36px)" }}>{t("split_after_title")}</h2>
              <ul className="slide__bullets" style={{ marginTop: 16 }}>
                <li className="reveal-item">{t("split_after_1")}</li>
                <li className="reveal-item">{t("split_after_2")}</li>
                <li className="reveal-item">{t("split_after_3")}</li>
                <li className="reveal-item">{t("split_after_4")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 7: DIVIDER — THE MODULES ===== */}
        <section className="slide slide--divider" style={{ backgroundImage: "radial-gradient(ellipse at 60% 50%, var(--deck-accent-dim) 0%, transparent 40%)" }}>
          <span className="slide__number">03</span>
          <div>
            <h2 className="slide__heading reveal-item">{t("divider_3")}</h2>
            <p className="slide__subtitle reveal-item" style={{ marginTop: 12 }}>{t("divider_3_sub")}</p>
          </div>
        </section>

        {/* ===== SLIDE 8: FEATURES GRID ===== */}
        <section className="slide slide--features" style={{ backgroundImage: "radial-gradient(ellipse at 15% 80%, var(--deck-accent-dim) 0%, transparent 40%)" }}>
          <h2 className="slide__heading reveal-item">{t("features_title")}</h2>
          <div className="slide__features">
            {[
              { icon: "🏫", titleKey: "feat_1_title", descKey: "feat_1_desc" },
              { icon: "📋", titleKey: "feat_2_title", descKey: "feat_2_desc" },
              { icon: "⏰", titleKey: "feat_3_title", descKey: "feat_3_desc" },
              { icon: "💰", titleKey: "feat_4_title", descKey: "feat_4_desc" },
              { icon: "🛏️", titleKey: "feat_5_title", descKey: "feat_5_desc" },
              { icon: "✅", titleKey: "feat_6_title", descKey: "feat_6_desc" },
            ].map((f, i) => (
              <div key={i} className="slide__feature reveal-item">
                <div className="slide__feature-icon" style={{ fontSize: 18 }}>{f.icon}</div>
                <div className="slide__feature-title">{t(f.titleKey)}</div>
                <div className="slide__feature-desc">{t(f.descKey)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== SLIDE 9: CHART ===== */}
        <section className="slide slide--chart" style={{ backgroundImage: "radial-gradient(ellipse at 75% 75%, var(--deck-accent-dim) 0%, transparent 40%)" }}>
          <h2 className="slide__heading reveal-item">{t("chart_title")}</h2>
          <div className="chart-wrap reveal-item">
            <div className="bar-chart" aria-label={t("chart_title")}>
              <div className="bar-chart__col"><span className="bar-chart__val">$0</span><div className="bar-chart__bar bar-chart__bar--ghost" style={{ height: "4%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$120K</span><div className="bar-chart__bar" style={{ height: "22%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$240K</span><div className="bar-chart__bar" style={{ height: "40%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$350K</span><div className="bar-chart__bar" style={{ height: "58%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$460K</span><div className="bar-chart__bar" style={{ height: "76%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$1.2M+</span><div className="bar-chart__bar" style={{ height: "95%" }}></div></div>
            </div>
            <div className="bar-chart__labels">
              <span>{t("chart_label_1")}</span><span>{t("chart_label_2")}</span><span>{t("chart_label_3")}</span><span>{t("chart_label_4")}</span><span>{t("chart_label_5")}</span><span>{t("chart_label_6")}</span>
            </div>
          </div>
          <p className="slide__subtitle reveal-item" style={{ marginTop: "clamp(8px,1.5vh,16px)" }}>{t("chart_subtitle")}</p>
        </section>

        {/* ===== SLIDE 10: QUOTE ===== */}
        <section className="slide slide--quote" style={{ backgroundImage: "radial-gradient(ellipse at 50% 50%, var(--deck-accent-dim) 0%, transparent 35%)" }}>
          <div className="slide__quote-mark reveal-item">&ldquo;</div>
          <blockquote className="reveal-item">{t("quote_text")}</blockquote>
          <cite className="reveal-item">{t("quote_author")}</cite>
        </section>

        {/* ===== SLIDE 11: FULL-BLEED CTA ===== */}
        <section className="slide slide--bleed">
          <div className="slide__bg--gradient" />
          <div className="slide__scrim" />
          <div className="slide__content">
            <p className="slide__label reveal-item" style={{ color: "rgba(255,255,255,0.6)" }}>05 · {t("bleed_label")}</p>
            <h2 className="slide__heading reveal-item">{t("bleed_title")}</h2>
            <p className="slide__subtitle reveal-item" style={{ color: "rgba(255,255,255,0.6)", marginTop: 12 }}>{t("bleed_subtitle")}</p>
            <div className="reveal-item" style={{ marginTop: "clamp(24px,4vh,48px)", display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input type="email" placeholder={t("bleed_placeholder")}
                style={{
                  flex: 1, minWidth: 220, padding: "14px 20px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)",
                  color: "#fff", fontSize: 15, outline: "none",
                }}
              />
              <a href="/auth/login" className="deck-cta deck-cta--primary">{t("cta_start")} →</a>
            </div>
            <p className="slide__subtitle reveal-item" style={{ color: "rgba(255,255,255,0.4)", marginTop: 12, fontSize: 12 }}>{t("bleed_note")}</p>
          </div>
        </section>

      </div>
    </>
  );
}
