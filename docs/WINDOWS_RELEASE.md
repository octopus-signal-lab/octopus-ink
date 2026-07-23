# Windows release

Octopus Ink uses Tauri's NSIS target for Windows installers. The GitHub
workflow at `.github/workflows/desktop-release.yml` builds the installer on a
Windows runner and uploads it as a workflow artifact.

## First unsigned build

1. Push `main` to GitHub.
2. Open **Actions** -> **Windows desktop build**.
3. Choose **Run workflow** on `main`.
4. Download the `octopus-ink-windows-installer` artifact from the completed run.

The first build is intentionally unsigned (`--no-sign`). Windows may show a
SmartScreen warning until a Windows code-signing certificate is wired in and the
app builds reputation.

## Signing later

When the Windows certificate is ready, store certificate material only in GitHub
Actions secrets, not in the repo. Then replace the `--no-sign` build with a
signed build.

Tauri supports Windows signing with `signtool.exe` on Windows runners, or a
custom `bundle.windows.signCommand` if the certificate provider requires a cloud
signing tool such as Azure Trusted Signing.

## Publishing to the splash page

After the installer is built and checked, place the chosen `.exe` at:

```text
public/downloads/octopus-ink-0.1.0-windows-x64-setup.exe
```

Then update `app/splash/page.tsx` so the Windows item links to that file instead
of showing "soon".
