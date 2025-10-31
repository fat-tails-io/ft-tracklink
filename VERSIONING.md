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
| `v1.0.0` | `1.0.0` | Complete product (all phases shipped) |

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

5. Publish the GitHub Release:

   ```bash
   gh release create v0.0.N --title "v0.0.N — Phase N" --notes-file RELEASE_NOTES_v0.0.N.md
   ```

When Phase 7 is complete, bump to `1.0.0`, tag `v1.0.0`, and publish the stable release.

## Forge installs

Releases are **source only**. After checkout:

- Run `npm install` and build `resources/track-viewer`.
- Set your own `app.id` in `manifest.yml` before `forge deploy` (do not use a developer-specific app id from another environment).
