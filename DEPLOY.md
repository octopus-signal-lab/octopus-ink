# Handover runbook — Octopus Ink → `ink.octosignal.org` (+ desktop wrapper)

**Audience: Codex.** Claude Code has finished all local/isolated work (app, hardening,
tests, CI, the splash page) and is handing the rest to you: **production deploy** and the
**desktop (Tauri) wrapper**. This is a standalone Next.js app with **no backend and no
secrets**.

## Status (what's done)
- Branch `main`. History was re-initialised after the working folder was renamed; the base
  commit is **`e99245d`** with a follow-up commit adding the splash page (run `git log` for
  the exact hash). **No git remote yet — you add it.**
- App verified locally: `npm run build` ✓, `npm run typecheck` ✓, `npm run lint` ✓
  (only `<img>` LCP warnings, the house convention), `npm run test` ✓ (17/17).
- Already in the repo: DOMPurify XSS sanitization, CSP + security headers
  (`next.config.ts`), PWA/offline service worker, `.github/workflows/ci.yml`,
  `.github/dependabot.yml`.
- **Splash / landing page** at route **`/splash`** (`app/splash/`), ecosystem-aligned
  (OctoSignal black/gold). The editor still owns `/`; the splash is a separate route.

## Targets (create NEW resources only)
| Thing | Value |
|---|---|
| GitHub repo | `octopus-signal-lab/octopus-ink` (**private**) |
| GitHub identity | SSH alias `github-octopus` (`~/.ssh/id_ed25519_octopus`), author `Evelyne Kanakis <evelyne@octosignal.org>` |
| Vercel team | `team_D6j7O0ZFiQBYefK7JRELkabK` (same team as `octosignal` / `museweaver`) |
| Vercel project | `octopus-ink` (**new** — do NOT link to `octosignal` or `museweaver`) |
| Framework | Next.js (App Router), root `./`, Node 22.x+ |
| Domain | `ink.octosignal.org` (subdomain — **no change to the `octosignal` project**) |

## Safety rules
- **Do not** modify the `octosignal` or `museweaver` projects, their `.vercel/` links,
  domains, or repos.
- When linking Vercel, explicitly **create a new project** — never select an existing one.
- **Before creating anything**, confirm the CLI/account is on team `team_D6j7O0ZFiQBYefK7JRELkabK`.
- No environment variables are required (100% client-side app).
- **Preview first. Do not promote to production without Evelyne's OK.**

---

## Phase A — Deploy the web app

### 1. Create the private repo + push
```bash
cd /Users/evelyne/Developer/OCTOPUS_ECOSYSTEM/octopus-ink
gh repo create octopus-signal-lab/octopus-ink --private --source . --remote origin --push
# manual alternative (note the SSH host alias is github-octopus, NOT github.com):
#   git remote add origin git@github-octopus:octopus-signal-lab/octopus-ink.git
#   git push -u origin main
```

### 2. Create + link the Vercel project (preview first)
```bash
vercel whoami && vercel teams ls          # confirm team_D6j7O0ZFiQBYefK7JRELkabK
vercel link --yes --project octopus-ink   # CREATE NEW on that team — do not pick octosignal/museweaver
vercel                                     # PREVIEW deployment → preview URL
```
Or import the GitHub repo in the Vercel dashboard (team `team_D6j7…`, framework auto =
Next.js, root `./`). Git integration gives auto previews on push.

### 3. Verify the preview (smoke test)
- App loads at `/`, no console errors; **`/splash`** renders (hero, 9-dot launcher,
  animated app-preview, features, FAQ, footer).
- `GET /manifest.webmanifest` → 200, `application/manifest+json`.
- Response headers include `Content-Security-Policy` (no `'unsafe-eval'` in the prod build)
  + `X-Content-Type-Options: nosniff`.
- Open a `.md`, switch Visual/Raw, paste rich text, insert an image — all work.

### 4. Attach the subdomain
- Vercel → `octopus-ink` → **Settings → Domains** → add `ink.octosignal.org`.
- Add the **CNAME** `ink` → `cname.vercel-dns.com` at the `octosignal.org` DNS provider.
  This does **not** touch the apex or any existing subdomain.

### 5. Promote to production (only after Evelyne approves)
- Merge to `main` (git integration auto-deploys prod) or `vercel --prod`.

---

## Phase B — Wire the splash placeholders (before public launch)
All in `app/splash/page.tsx`:
- **GitHub link is wrong** — the FAQ "Is it really open source?" answer points to
  `github.com/octosignal/octopus-ink`. Change to **`github.com/octopus-signal-lab/octopus-ink`**
  (the real repo from Phase A). It's the only stale repo URL in the codebase.
- **"Open in browser"** CTA → `OPEN_URL = "/"` (the editor). Fine for a standalone deploy.
  Open question for Evelyne: should the **splash be the front door at `/`** (editor moved to
  `/app`) instead? If yes, move the editor route and update `OPEN_URL`, the PWA `start_url`
  in `app/manifest.ts`, and the service worker. Currently deferred — confirm before launch.
- **Desktop download buttons** (macOS `.dmg`, Windows `.exe`) are inert placeholders
  (`href="#"`, `preventDefault`). Wire them to real artifacts in **Phase C**.

---

## Phase C — Desktop wrapper (Tauri) — now Codex-owned

Goal: ship Mac (`.dmg`) + Windows (`.exe`) builds of the same app, wired into the splash's
"Download for desktop" buttons. **Recommend Tauri v2** (small bundles, native menus).

**Key constraint — file I/O.** The web app's open/save relies on the **File System Access
API** (`showOpenFilePicker` / `showDirectoryPicker`, see `lib/fileSystem.ts`). That API exists
in **WebView2 (Windows, Chromium)** but **NOT in WKWebView (macOS, Safari engine)** that Tauri
uses on Mac — so a naive wrapper loses open/save-to-disk on macOS. Plan:
1. **Static export** for bundling: add `output: "export"` (Next.js) and confirm the SPA still
   builds (it's already client-only). Note: the HTTP security headers in `next.config.ts` are
   **ignored by static export** — set CSP at the Vercel host for the web app, and in
   `tauri.conf.json` for the desktop app.
2. **Add a Tauri-native file adapter.** Detect Tauri at runtime (`window.__TAURI__`) and route
   open/save through `@tauri-apps/plugin-dialog` + `@tauri-apps/plugin-fs` instead of FSA, so
   Mac gets real file dialogs + write-back. Keep the existing FSA path for the browser. This is
   the one non-trivial code change; isolate it behind the existing `lib/fileSystem.ts` seams.
3. **Build + sign:** `tauri build` for both targets. Code-sign/notarize the macOS build
   (Gatekeeper blocks unsigned apps); sign the Windows `.exe` if a cert is available.
4. **Host the artifacts** (GitHub Releases on `octopus-signal-lab/octopus-ink` is simplest) and
   **wire the splash download buttons** to those URLs (replace the `href="#"` placeholders).

---

## CI / license
- `.github/workflows/ci.yml` runs typecheck + lint + test + build on every push/PR — no deploy
  secrets needed. `.github/dependabot.yml` opens weekly dependency PRs once the repo exists.
- No `LICENSE` file yet — add one before making the repo public (the app is intended to be
  open-source/downloadable; the splash already advertises it as open source).
