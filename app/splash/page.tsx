"use client";

import { useEffect, useRef, useState } from "react";
import "./splash.css";

/* Where the CTAs point. Splash-only build: "Open in browser" goes to the editor
   at "/", which is a real working link. Desktop downloads are placeholders until
   the Tauri wrapper ships (next roadmap phase). */
const OPEN_URL = "/";

/* ---------------- icons (shared) ---------------- */
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg className="dl-apple" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.8 12.4c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.6 2.2 1 0 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.1-3.1zM13.7 6.1c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2z" />
    </svg>
  );
}
function WindowsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5.6 10.4 4.6v6.9H3zM3 12.5h7.4v6.9L3 18.4zM11.4 4.4 21 3v8.5h-9.6zM11.4 12.5H21V21l-9.6-1.4z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.3" />
      <path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7" />
    </svg>
  );
}

/* Shared CTA pair (hero + closing). */
function CtaRow() {
  const preventDefault = (e: React.MouseEvent) => e.preventDefault();
  return (
    <div className="cta-row">
      <a className="btn primary" href={OPEN_URL}>
        <EyeIcon />
        Open in browser
      </a>
      <div className="dl-menu">
        <button className="btn ghost" type="button">
          <DownloadIcon />
          Download for desktop
        </button>
        <div className="dl-pop">
          {/* Placeholders — wire to real .dmg / .exe artifacts when the desktop build ships. */}
          <a href="#" onClick={preventDefault}>
            <AppleIcon />
            macOS<span className="meta">.dmg · Apple Silicon + Intel</span>
          </a>
          <a href="#" onClick={preventDefault}>
            <WindowsIcon />
            Windows<span className="meta">.exe · 64-bit</span>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 9-dot app launcher (own state, isolated) ---------------- */
function AppLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="app-launcher">
      <button
        type="button"
        className="app-launcher__button"
        aria-label="App switcher"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="app-launcher__dots" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i /><i /><i />
        </span>
      </button>
      <button
        type="button"
        className={`app-launcher__scrim${open ? " is-open" : ""}`}
        aria-label="Close app switcher"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
      <div className={`app-launcher__panel${open ? " is-open" : ""}`} role="menu" aria-hidden={!open}>
        <div className="app-launcher__head">
          <span>OctoSignal Apps</span>
          <button type="button" className="app-launcher__close" aria-label="Close app switcher" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="app-launcher__grid">
          <a className="app-launcher__tile is-active" href={OPEN_URL} role="menuitem" onClick={() => setOpen(false)}>
            <span className="app-launcher__badge app-launcher__badge--here">Here</span>
            <span className="app-launcher__icon"><img src="/octopus-doc.png" alt="" /></span>
            <span className="app-launcher__name">Octopus Ink</span>
          </a>
          <a className="app-launcher__tile" href="https://octosignal.org/" role="menuitem" onClick={() => setOpen(false)}>
            <span className="app-launcher__icon"><img src="/splash/icon-octopus-signal-lab.png" alt="" loading="lazy" /></span>
            <span className="app-launcher__name">Octopus Signal Lab</span>
          </a>
          <a className="app-launcher__tile" href="https://museweaver.io/parlor" role="menuitem" onClick={() => setOpen(false)}>
            <span className="app-launcher__icon"><img src="/splash/icon-museweaver-parlor.png" alt="" loading="lazy" /></span>
            <span className="app-launcher__name">Museweaver Parlor</span>
          </a>
          <div className="app-launcher__tile is-disabled" aria-disabled="true">
            <span className="app-launcher__badge"><LockIcon />Soon</span>
            <span className="app-launcher__icon"><img src="/splash/icon-museweaver-studio.png" alt="" loading="lazy" /></span>
            <span className="app-launcher__name">Museweaver Studio</span>
          </div>
          <div className="app-launcher__tile is-disabled" aria-disabled="true">
            <span className="app-launcher__badge"><LockIcon />Soon</span>
            <span className="app-launcher__icon"><img src="/splash/icon-brainweaver.png" alt="" loading="lazy" /></span>
            <span className="app-launcher__name">BrainWeaver</span>
          </div>
        </div>
        <div className="app-launcher__foot">
          <div className="app-launcher__links">
            <a href="https://octosignal.org/legal">Terms</a>
            <a href="https://octosignal.org/privacy">Privacy</a>
            <a href="https://octosignal.org/">About</a>
            <a href="https://octosignal.org/contact">Contact</a>
          </div>
          <div className="app-launcher__copy">© OctoSignal Lab 2026 · All rights reserved</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- app-preview showreel (own rAF, isolated) ---------------- */
function AppPreview() {
  const browserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const br = browserRef.current;
    if (!br) return;
    if (!window.matchMedia || !matchMedia("(prefers-reduced-motion:no-preference)").matches) return;

    const h1 = br.querySelector<HTMLElement>(".p-h1");
    const main = br.querySelector<HTMLElement>(".p-main");
    const cursor = br.querySelector<HTMLElement>(".p-cursor");
    const tBold = br.querySelector<HTMLElement>(".t-bold");
    const tColor = br.querySelector<HTMLElement>(".t-color");
    const tTheme = br.querySelector<HTMLElement>(".t-theme");
    const sel = br.querySelector<HTMLElement>(".sel");
    if (!h1 || !main || !cursor || !tBold || !tColor || !tTheme || !sel) return;

    const FULL = "Type & Voice";
    const LOOP = 14000;
    let t0: number | null = null;
    let raf = 0;
    let lastTarget: HTMLElement | null = null;
    let lastCls = "";

    function moveCursor(el: HTMLElement | null) {
      if (!el || el === lastTarget || !main || !cursor) return;
      lastTarget = el;
      const mr = main.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      cursor.style.transform = `translate(${er.left - mr.left + er.width * 0.5}px, ${er.top - mr.top + er.height * 0.5}px)`;
    }

    function frame(now: number) {
      if (t0 === null) t0 = now;
      const t = (now - t0) % LOOP;
      // headline typewriter
      let chars: number;
      if (t < 350) chars = 0;
      else if (t < 1500) chars = Math.round(((t - 350) / 1150) * FULL.length);
      else chars = FULL.length;
      const txt = FULL.slice(0, chars);
      if (h1!.textContent !== txt) h1!.textContent = txt;
      // scene flags derived purely from elapsed time
      const cls = ["browser", "is-animated"];
      if (t >= 350 && t < 1550) cls.push("scene-typing");
      if (t >= 1700) cls.push("body-in");
      const showCursor = (t >= 2600 && t < 7400) || (t >= 10100 && t < 11050);
      if (showCursor) cls.push("show-cursor");
      if (t >= 3300 && t < 4550) cls.push("fmt-sel");
      if (t >= 4550) cls.push("fmt-done");
      if (t >= 5750 && t < 7300) cls.push("show-colorpop");
      if (t >= 6550 && t < 7300) cls.push("color-pick");
      if (t >= 6800) cls.push("clr-done");
      if (t >= 7800 && t < 9900) cls.push("scene-raw");
      if (t >= 10650 && t < 12800) cls.push("scene-dark");
      const newCls = cls.join(" ");
      if (newCls !== lastCls) {
        br!.className = newCls;
        lastCls = newCls;
      }
      // persistent active (selected) states on toolbar buttons
      tBold!.classList.toggle("t-on", t >= 4550 && t < 9900);
      tColor!.classList.toggle("t-on", t >= 5750 && t < 7300);
      // click pulses (button + cursor) at each interaction
      const clickWin = (a: number) => t >= a && t < a + 260;
      tBold!.classList.toggle("p-press", clickWin(4550));
      tColor!.classList.toggle("p-press", clickWin(5750));
      tTheme!.classList.toggle("p-press", clickWin(10550));
      cursor!.classList.toggle("clicking", clickWin(4550) || clickWin(5750) || clickWin(6750) || clickWin(10550));
      // cursor targets
      if (t >= 2600 && t < 3950) moveCursor(sel);
      else if (t >= 3950 && t < 5200) moveCursor(tBold);
      else if (t >= 5200 && t < 6300) moveCursor(tColor);
      else if (t >= 6300 && t < 7400) moveCursor(br!.querySelector<HTMLElement>(".sw-red"));
      else if (t >= 10100 && t < 11050) moveCursor(tTheme);
      if (t < 300) lastTarget = null; // allow the cursor to re-glide next loop
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="preview-wrap">
      <div className="browser is-animated" ref={browserRef}>
        <div className="br-bar">
          <span className="br-dot" style={{ background: "#e0685b" }} />
          <span className="br-dot" style={{ background: "#e3c062" }} />
          <span className="br-dot" style={{ background: "#6cbf6c" }} />
        </div>
        <div className="app">
          <aside className="p-rail">
            <img className="p-wordmark" src="/octopus-logo-text.png" alt="Octopus Ink" />
            <div className="p-add">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Add document
            </div>
            <div className="p-search">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              Filter files…
            </div>
            <div>
              <div className="p-grp">
                <svg className="gc" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <svg className="gf" viewBox="0 0 24 24" fill="none"><path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
                new-branding
              </div>
              <div className="p-file"><span className="pd" />colors.md</div>
              <div className="p-file on"><span className="pd" />type.md</div>
              <div className="p-file"><span className="pd" />voice.md</div>
              <div className="p-file"><span className="pd" />readme.md</div>
            </div>
            <div className="p-railfoot"><span className="rfd" /><span className="rfn">About &amp; help</span><span className="rfv">v1.0</span></div>
          </aside>
          <div className="p-main">
            <div className="p-cursor">
              <svg viewBox="0 0 24 24" fill="#f6e7bd" stroke="#1c1409" strokeWidth="1.1" strokeLinejoin="round"><path d="M5 3l14 8.5-6 1.4 3.2 6.2-2.7 1.3-3.2-6.3L5 19z" /></svg>
            </div>
            <div className="p-top">
              <div className="p-title">type.md<div className="pm">new-branding · 214 words · 1 min read</div></div>
              <div className="p-lens">
                <div className="pg" />
                <div className="p-seg on s-vis">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
                  Visual
                </div>
                <div className="p-seg off s-raw">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M9 8l-4 4 4 4M15 8l4 4-4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Raw
                </div>
              </div>
            </div>
            <div className="p-tools">
              <span className="p-tool"><svg viewBox="0 0 24 24" fill="none"><path d="M8 8H5V5M5 8a9 9 0 1 1-2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="p-tool"><svg viewBox="0 0 24 24" fill="none"><path d="M16 8h3V5M19 8a9 9 0 1 0 2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="p-div" />
              <span className="p-tt"><svg viewBox="0 0 24 24" fill="none" style={{ width: 15, height: 15 }}><path d="M5 6.3V5h14v1.3M12 5.2v13.6M9.6 18.8h4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Normal</span>
              <span className="p-div" />
              <span className="p-tool t-bold" style={{ fontWeight: 800 }}>B</span>
              <span className="p-tool" style={{ fontStyle: "italic", fontFamily: "Georgia,serif", fontSize: 15 }}>I</span>
              <span className="p-tool" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>&lt;&gt;</span>
              <span className="p-cwrap">
                <span className="p-color t-color"><b>A</b><i /></span>
                <div className="p-colorpop">
                  <span className="sw" style={{ background: "#a9781d" }} />
                  <span className="sw sw-red" style={{ background: "#c5301f" }} />
                  <span className="sw" style={{ background: "#bb6a13" }} />
                  <span className="sw" style={{ background: "#1c7d6e" }} />
                  <span className="sw" style={{ background: "#6536b8" }} />
                  <span className="sw" style={{ background: "#a83d8f" }} />
                </div>
              </span>
              <span className="p-tool"><svg viewBox="0 0 24 24" fill="none"><path d="M8 7h12M8 12h12M8 17h9M4 7h.01M4 12h.01M4 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
              <span className="p-tool"><svg viewBox="0 0 24 24" fill="none"><path d="M9 7c-2 1-3 3-3 6h3v4H4v-5c0-3 1.5-5 5-5zM19 7c-2 1-3 3-3 6h3v4h-5v-5c0-3 1.5-5 5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg></span>
              <span className="p-tool"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
              <span className="p-div" />
              <span className="p-tool"><svg viewBox="0 0 24 24" fill="none"><path d="M10.4 13.6a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 1 0-5.1-5.1l-1.6 1.6M13.6 10.4a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 1 0 5.1 5.1l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="p-tool"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><circle cx="9" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.5" /><path d="m5 17 5-4 4 3 3-2 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg></span>
              <span className="p-div" />
              <span className="p-tool p-theme t-theme">
                <svg className="ts-moon" viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                <svg className="ts-sun" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.5v2.2M12 19.3v2.2M4.3 12H2.1M21.9 12h-2.2M5.6 5.6 4 4M20 20l-1.6-1.6M18.4 5.6 20 4M4 20l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </span>
              <span className="p-actions">Actions<svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            </div>
            <div className="p-stage">
              <div className="p-view p-visual">
                <div className="p-doc">
                  <h1><span className="p-h1">Type &amp; Voice</span><span className="p-type-caret" /></h1>
                  <div className="body">
                    <div className="lead">The typographic system for the new brand.</div>
                    <p>We pair a <span className="sel">serif display</span> face for headlines with a clean grotesque for body copy. Keep line length comfortable and let the page breathe.</p>
                    <h2>Principles</h2>
                    <ul>
                      <li>Generous whitespace over density</li>
                      <li>One accent color, used <span className="tag">sparingly</span></li>
                      <li>Hierarchy through size, not decoration</li>
                    </ul>
                    <blockquote>Good type is invisible; it simply lets the words speak.</blockquote>
                  </div>
                </div>
              </div>
              <div className="p-view p-rawview">
                <pre className="p-src">
                  <span className="mk"># </span><span className="hd">Type &amp; Voice</span>
                  {"\n\nThe typographic system for the new brand.\n\nWe pair a "}
                  <span className="mk">**</span><span className="bd">serif display</span><span className="mk">**</span>
                  {" face for headlines with a\nclean grotesque for body copy. Keep line length\ncomfortable and let the page breathe.\n\n"}
                  <span className="mk">## </span><span className="hd">Principles</span>
                  {"\n\n"}
                  <span className="mk">- </span>{"Generous whitespace over density\n"}
                  <span className="mk">- </span>{"One accent color, used "}<span className="mk">`</span><span className="cd">sparingly</span><span className="mk">`</span>{"\n"}
                  <span className="mk">- </span>{"Hierarchy through size, not decoration\n\n"}
                  <span className="mk">&gt; </span>{"Good type is invisible; it simply lets the\n"}
                  <span className="mk">&gt; </span>words speak.<span className="p-caret" />
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function SplashPage() {
  return (
    <div className="oi-splash">
      <div className="bg-glow" />
      <div className="wrap">
        {/* OCTOSIGNAL HEADER */}
        <nav className="nav">
          <a className="nav__logo" href="https://octosignal.org/" aria-label="Octopus Signal Lab home">
            <img src="/splash/octolab-logo.png" alt="Octopus Signal Lab" />
          </a>
          <div className="nav__logo-spacer" />
        </nav>

        <AppLauncher />

        {/* HERO */}
        <header className="hero">
          <img className="mark" src="/octopus-doc.png" alt="Octopus Ink" />
          <h1>Read &amp; write Markdown, <em>two ways.</em></h1>
          <p className="sub">
            Octopus Ink is a free, open-source app that opens your local <b>.md</b> files in two lenses: a clean rendered{" "}
            <b>Visual</b> view and the <b>Raw</b> source. Edit in either, and your changes stay in sync. It runs entirely on
            your device, so nothing is ever uploaded.
          </p>
          <CtaRow />
          <div className="trust">
            <span>Free &amp; open source</span>
            <span>100% local, no account</span>
            <span>Chrome, Edge &amp; desktop</span>
          </div>
        </header>

        {/* APP PREVIEW */}
        <AppPreview />

        {/* FEATURES */}
        <section className="section" id="features">
          <div className="sec-head">
            <h2>A calm home for your <em>Markdown.</em></h2>
            <p>Built for people who keep their notes, docs, and drafts as local Markdown files, and want a beautiful way to read and edit them.</p>
          </div>
          <div className="feat-grid">
            <div className="feat">
              <div className="fk">Two lenses</div>
              <h3>Always <em>in sync</em></h3>
              <p>Flip between the rendered Visual page and the Raw Markdown source. Edit in either, and changes flow both ways, so you write however you prefer.</p>
            </div>
            <div className="feat">
              <div className="fk">Local-first</div>
              <h3>Yours, and <em>private</em></h3>
              <p>Your files are read, edited, and saved entirely on your machine. No server, no account, no uploads, ever. What you write stays yours.</p>
            </div>
            <div className="feat">
              <div className="fk">Import</div>
              <h3>Convert to <em>Markdown</em></h3>
              <p>Drop in a Word <b>.docx</b> or an <b>.html</b> file and Octopus Ink converts it to clean Markdown as a new copy, so your originals are never touched.</p>
            </div>
            <div className="feat">
              <div className="fk">Editing</div>
              <h3>A real <em>writing toolbar</em></h3>
              <p>Headings, bold, italic, code, lists, task lists, quotes, links, text color, find-in-document, and a light or dark page, all a click away.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq" style={{ paddingTop: 20 }}>
          <div className="sec-head">
            <h2>Questions, <em>answered.</em></h2>
          </div>
          <div className="faq-wrap">
            <details className="faq" open>
              <summary>Do I need to create an account or pay?</summary>
              <p>No. Octopus Ink is free and open source, with no account and no sign-up. Open it and start reading or writing.</p>
            </details>
            <details className="faq">
              <summary>Where are my files stored?</summary>
              <p>On your own device, full stop. The app reads and saves your local files directly through your web app or desktop app, and nothing is uploaded to a server or tracked.</p>
            </details>
            <details className="faq">
              <summary>What&apos;s the difference between the browser and desktop versions?</summary>
              <p>They&apos;re the same app. The browser version runs in Chrome or Edge and can open files and folders and save them back to disk. The desktop app wraps the same experience in a native window for Mac and Windows, handy if you&apos;d rather not keep a tab open.</p>
            </details>
            <details className="faq">
              <summary>What can I open and import?</summary>
              <p>You can open <b>.md</b>, <b>.markdown</b>, <b>.mdx</b>, and <b>.txt</b> files directly. Import &amp; convert also turns <b>.docx</b> and <b>.html</b> into Markdown. Complex Word formatting may simplify during conversion.</p>
            </details>
            <details className="faq">
              <summary>Is it really open source?</summary>
              <p>Yes. The source is on <a href="https://github.com/octosignal/octopus-ink" target="_blank" rel="noopener">GitHub</a>. You&apos;re welcome to read it, build it yourself, or contribute. A little credit or a link back to <a href="https://octosignal.org/" target="_blank" rel="noopener">OctoSignal Lab</a> is always appreciated.</p>
            </details>
          </div>
        </section>

        {/* CLOSING */}
        <section className="closer">
          <h2>Open your first document.</h2>
          <p>No setup, no account. Just your Markdown, two ways.</p>
          <CtaRow />
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer__bottom">
            <div className="footer__inner">
              <div className="footer__copy">
                <span className="footer__copy-brand">© 2026 OCTOPUS SIGNAL LAB</span>
                <span className="footer__copy-tag">An independent AI research practice</span>
              </div>
              <div className="footer__links">
                <a href="https://octosignal.org/faq">FAQs</a>
                <a href="https://octosignal.org/contact">CONTACT</a>
                <a href="https://octosignal.org/privacy">PRIVACY</a>
                <a href="https://octosignal.org/legal">LEGAL</a>
              </div>
              <div className="footer__social">
                <a href="https://x.com/museweaverAI" aria-label="MuseweaverAI on X">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="footer__subscribe">
            <div className="footer__subscribe-inner">
              <div className="footer__subscribe-copy">
                <h4>Updates from the work, when they happen. Nothing else.</h4>
              </div>
              <form className="fn-subscribe-form" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="you@example.com" aria-label="Email address" />
                <button type="submit">SUBSCRIBE</button>
              </form>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
