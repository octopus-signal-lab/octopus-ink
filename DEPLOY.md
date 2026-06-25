# Deploy runbook — Octopus Ink → `ink.octosignal.org`

Handoff doc for **Codex** (owns the live Vercel/GitHub production deploys). Claude Code has
done all the local prep: the app is built-verified, `git` is initialised with a first commit
on `main`, and this is a **standalone Next.js app** with **no backend and no secrets**.

## Target (create NEW resources only)
| Thing | Value |
|---|---|
| GitHub repo | `octopus-signal-lab/octopus-ink` (**private**) |
| GitHub identity | SSH alias `github-octopus` (`~/.ssh/id_ed25519_octopus`), author `Evelyne Kanakis <evelyne@octosignal.org>` |
| Vercel team | `team_D6j7O0ZFiQBYefK7JRELkabK` (same team as `octosignal` / `museweaver`) |
| Vercel project | `octopus-ink` (**new** — do NOT link to `octosignal` or `museweaver`) |
| Framework | Next.js (App Router), root directory `./`, Node 22.x+ |
| Domain | `ink.octosignal.org` (subdomain — **no change to the `octosignal` project**) |

## Safety rules
- **Do not** modify the `octosignal` or `museweaver` projects, their `.vercel/` links, domains, or repos.
- When linking Vercel, explicitly **create a new project** — never select an existing one.
- **Before creating anything**, confirm the Vercel CLI/account is on team `team_D6j7O0ZFiQBYefK7JRELkabK`.
- No environment variables are required (100% client-side app).
- **Preview first. Do not promote to production without Evelyne's OK.**

## Steps

### 1. Create the private repo + push
```bash
cd /Users/evelyne/Developer/OCTOPUS_ECOSYSTEM/octopus-ink
# create the repo in the org (gh, or create it in the GitHub UI then just add the remote)
gh repo create octopus-signal-lab/octopus-ink --private --source . --remote origin --push
# if not using gh, do it manually:
#   git remote add origin git@github-octopus:octopus-signal-lab/octopus-ink.git
#   git push -u origin main
```
> Note the SSH host is the alias **`github-octopus`**, not `github.com`.

### 2. Create + link the Vercel project (preview first)
```bash
vercel whoami           # confirm correct account
vercel teams ls         # confirm team_D6j7O0ZFiQBYefK7JRELkabK is available
# from the app dir — link to a NEW project named octopus-ink, on that team:
vercel link --yes --project octopus-ink   # choose the correct team, CREATE NEW (do not pick octosignal/museweaver)
vercel                  # builds a PREVIEW deployment → returns a preview URL
```
Or connect the GitHub repo in the Vercel dashboard (Import Project → pick `octopus-signal-lab/octopus-ink` → team `team_D6j7…` → framework auto-detects Next.js → root `./`). With git integration, pushes to a branch create previews automatically.

### 3. Verify the preview (smoke test)
- App loads, no console errors.
- `GET /manifest.webmanifest` → 200, `application/manifest+json`.
- Response headers include `Content-Security-Policy` (no `'unsafe-eval'` in prod build) + `X-Content-Type-Options: nosniff`.
- Open a `.md`, switch Visual/Raw lenses, paste rich text, insert an image — all work.

### 4. Attach the subdomain
- Vercel → `octopus-ink` project → **Settings → Domains** → add `ink.octosignal.org`.
- Add the DNS record Vercel shows (a **CNAME** `ink` → `cname.vercel-dns.com`) at the `octosignal.org` DNS provider. This does **not** affect the apex (`octosignal.org`) or any existing subdomain.

### 5. Promote to production (only after Evelyne approves)
- Merge the branch to `main` (git integration auto-deploys prod), or `vercel --prod`.

## After deploy
Hand back to **Claude Code** for: live smoke test, then the **Tauri desktop wrapper** (next roadmap phase).

## CI note
`.github/workflows/ci.yml` runs typecheck + lint + test + build on every push/PR — no deploy
secrets needed. `.github/dependabot.yml` opens weekly dependency PRs once the repo exists.

## License
No `LICENSE` file yet — add one before making the repo public (the app is intended to be downloadable/open later).
