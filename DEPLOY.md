# Handover runbook — Octopus Ink → `ink.octosignal.org` (+ desktop wrapper)

**Audience: Codex.** Claude Code has finished all local/isolated work (app, hardening,
tests, CI, the splash page) and is handing the rest to you: **production deploy** and the
**desktop (Tauri) wrapper**. This is a standalone Next.js app with **no backend and no
secrets**.

## Status (what's done)
- Branch `main`. History was re-initialised after the working folder was renamed; the base
  commit is **`e99245d`** with follow-up commits for the splash page, the splash repo-link
  fix, and the Tauri wrapper scaffold (run `git log` for exact hashes). **No git remote yet.**
- App verified locally: `npm run build` ✓, `npm run typecheck` ✓, `npm run lint` ✓
  (only `<img>` LCP warnings, the house convention), `npm run test` ✓ (17/17).
- Already in the repo: DOMPurify XSS sanitization, CSP + security headers
  (`next.config.ts`), PWA/offline service worker, `.github/workflows/ci.yml`,
  `.github/dependabot.yml`.
- **Splash / landing page** is the public front door at **`/`** and remains available at
  **`/splash`** (`app/splash/`), ecosystem-aligned (OctoSignal black/gold). The editor lives
  at **`/app`**.
- **Tauri v2 wrapper scaffolded** in `src-tauri/`, with `@tauri-apps/plugin-dialog` +
  `@tauri-apps/plugin-fs` wired through `lib/tauriFileSystem.ts`. `npm run build:tauri:web`
  static-exports successfully to `out/`. Packaged `.dmg` / `.exe` artifacts are still blocked
  until Rust/Cargo (and signing/notarization credentials) are available.
- Vercel project **`octopus-ink`** has been created under team
  `team_D6j7O0ZFiQBYefK7JRELkabK`. No custom domain has been attached.

## Targets (create NEW resources only)
| Thing | Value |
|---|---|
| GitHub repo | `octopus-signal-lab/octopus-ink` (**public**) |
| GitHub identity | SSH alias `github-octopus` (`~/.ssh/id_ed25519_octopus`), author `Evelyne Kanakis <evelyne@octosignal.org>` |
| Vercel team | `team_D6j7O0ZFiQBYefK7JRELkabK` (same team as `octosignal` / `museweaver`) |
| Vercel project | `octopus-ink` (**new** — do NOT link to `octosignal` or `museweaver`) |
| Framework | Next.js (App Router), root `./`, Node 22.x+ |
| Domain | `ink.octosignal.org` (subdomain attached to the `octopus-ink` project — **no change to the `octosignal` project**) |

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
Codex could not complete this from the local shell because `gh` is not installed and there is
no GitHub API token in the environment. SSH auth for `github-octopus` works, so once the
empty private repo exists, pushing should work.

```bash
cd /Users/evelyne/Developer/OCTOPUS_ECOSYSTEM/octopus-ink
gh repo create octopus-signal-lab/octopus-ink --private --source . --remote origin --push
# manual alternative (note the SSH host alias is github-octopus, NOT github.com):
#   git remote add origin git@github-octopus:octopus-signal-lab/octopus-ink.git
#   git push -u origin main
```

### 2. Create + link the Vercel project (preview first)
Current status: project `octopus-ink` exists and local `.vercel/project.json` points to
`prj_DDCYx8pgAJK8E3KLeMto4Wt43m2S` / `team_D6j7O0ZFiQBYefK7JRELkabK`. Domain
`ink.octosignal.org` is attached to this project. The first CLI deploy was created from `main`
and Vercel labeled it `target: production`; deployment protection may still need review before
public launch.

```bash
vercel whoami && vercel teams ls          # confirm team_D6j7O0ZFiQBYefK7JRELkabK
vercel link --yes --project octopus-ink   # CREATE NEW on that team — do not pick octosignal/museweaver
vercel deploy --target=preview --skip-domain  # preview deployment → preview URL
```
Or import the GitHub repo in the Vercel dashboard (team `team_D6j7…`, framework auto =
Next.js, root `./`). Git integration gives auto previews on push.

### 3. Verify the preview (smoke test)
- Splash loads at `/`, no console errors; **`/splash`** also renders (hero, 9-dot launcher,
  animated app-preview, features, FAQ, footer).
- Editor loads at `/app`.
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
- **Done:** the FAQ GitHub link points to
  **`github.com/octopus-signal-lab/octopus-ink`**.
- **Done:** "Open in browser" CTA → `/app` (the editor). The splash is the front door at `/`;
  PWA `start_url` is `/app`.
- **Done:** the desktop download CTA points directly to the signed/notarized Mac `.dmg`.
  Windows is intentionally not advertised until there is a signed installer.

---

## Phase C — Desktop wrapper (Tauri) — now Codex-owned

Goal: ship Mac (`.dmg`) now and keep Windows (`.exe`) buildable but unpublished until signing
is worth the maintenance lane. **Recommend Tauri v2** (small bundles, native menus).

**Key constraint — file I/O.** The web app's open/save relies on the **File System Access
API** (`showOpenFilePicker` / `showDirectoryPicker`, see `lib/fileSystem.ts`). That API exists
in **WebView2 (Windows, Chromium)** but **NOT in WKWebView (macOS, Safari engine)** that Tauri
uses on Mac — so a naive wrapper loses open/save-to-disk on macOS. Plan:
1. **Done:** static export for bundling is conditional via `TAURI_BUILD=1`, so normal web
   builds keep Next/Vercel headers while `npm run build:tauri:web` emits `out/` for Tauri.
2. **Done:** Tauri-native file adapter is isolated in `lib/tauriFileSystem.ts` and routes
   open file, open folder, refresh folder, rename, and save through
   `@tauri-apps/plugin-dialog` + `@tauri-apps/plugin-fs` when running in Tauri. Browser FSA
   behavior remains the fallback path.
3. **Build + sign:** `tauri build` for both targets. Code-sign/notarize the macOS build
   (Gatekeeper blocks unsigned apps); sign the Windows `.exe` if a cert is available. Current
   blocker on this machine: `cargo` / Rust are not installed, so `npm run tauri:build` fails
   before compiling.
4. **Host the artifacts** (GitHub Releases on `octopus-signal-lab/octopus-ink` is simplest) and
   **wire the splash download buttons** to those URLs (replace the `href="#"` placeholders).

---

## CI / license
- `.github/workflows/ci.yml` runs typecheck + lint + test + build on every push/PR — no deploy
  secrets needed. `.github/dependabot.yml` opens weekly dependency PRs once the repo exists.
- No `LICENSE` file yet — add one before making the repo public (the app is intended to be
  open-source/downloadable; the splash already advertises it as open source).
