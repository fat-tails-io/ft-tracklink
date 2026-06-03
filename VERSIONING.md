# Versioning

This project uses [Semantic Versioning](https://semver.org/) aligned with the [F1 issue-centric roadmap](.cursor/plans/f1-issue-centric-roadmap.plan.md).

## Tag scheme

| Git tag | `package.json` | Roadmap phase |
|---------|----------------|---------------|
| `v0.0.0` | `0.0.0` | Phase 0 — GitHub baseline (demo) |
| `v0.0.1` | `0.0.1` | Phase 1 — Foundation refactor |
| `v0.0.2` | `0.0.2` | Phase 2 — ADS (UI Kit shell) |
| `v0.0.3` | `0.0.3` | Phase 3 — Multi-circuit library |
| `v0.0.4` | `0.0.4` | Phase 4 — High-precision track sampling |
| `v0.0.5` | `0.0.5` | Phase 5 — Issue-centric workflow |
| `v0.0.6` | `0.0.6` | Phase 6 — Jira custom fields |
| `v0.0.7` | `0.0.7` | Phase 7 — Rovo Chat |
| `v0.0.8` | `0.0.8` | Phase 8 — Session driver overlay (constructor accents) |
| `v1.0.0` | `1.0.0` | Complete product (Phases 1–8 shipped) |

The **patch** number equals the **phase** number during development (`0.0.N` → Phase N). Major and minor stay at `0` until the roadmap is complete; then **`v1.0.0`** marks the stable release.

## Download a version

Pre-built source archives are on [GitHub Releases](https://github.com/fat-tails-io/ft-tracklink/releases). Pick a tag (for example `v0.0.0`), then download **Source code (zip)** or clone and checkout:

```bash
git clone https://github.com/fat-tails-io/ft-tracklink.git
cd ft-tracklink
git checkout v0.0.0
```

## Cutting a release (maintainers)

After a phase merges to `main`:

1. Set `version` in `package.json` and `resources/track-viewer/package.json` to `0.0.N` (N = phase).
2. Add a section to `CHANGELOG.md`.
3. Commit on `main`.
4. Create an annotated tag and push:

   ```bash
   git tag -a v0.0.N -m "Phase N: <short title>"
   git push origin v0.0.N
   ```

5. Push the tag — a [GitHub Actions workflow](.github/workflows/release.yml) creates the Release automatically:

   ```bash
   git push origin v0.0.N
   ```

   Optional: add `RELEASE_NOTES_v0.0.N.md` before tagging for custom release text. Otherwise notes are taken from the matching `CHANGELOG.md` section, or a short default.

   To publish manually instead (workflow disabled or tag pushed before the workflow existed):

   ```bash
   gh release create v0.0.N --title "v0.0.N — Phase N" --notes-file RELEASE_NOTES_v0.0.N.md
   ```

When Phase 7 is complete, bump to `1.0.0`, tag `v1.0.0`, and push — the workflow marks `v1.0.0` as the non-prerelease stable release.

## Automated releases

[`.github/workflows/release.yml`](.github/workflows/release.yml) runs on tag push:

| Tag pattern | Release title | Prerelease |
|-------------|---------------|------------|
| `v0.0.0` … `v0.0.8` | `v0.0.N — Phase N` | yes |
| `v1.0.0` | `v1.0.0 — F1 Track Linker (stable)` | no |

Tags outside `v0.0.0`–`v0.0.8` and `v1.0.0` are rejected by the workflow. Re-pushing an existing tag does not re-run the workflow unless the tag is deleted and pushed again.

## Forge installs

Releases are **source only**. After checkout:

- Run `npm install` and build `resources/track-viewer`.
- Set your own `app.id` in `manifest.yml` before `forge deploy` (do not use a developer-specific app id from another environment).
