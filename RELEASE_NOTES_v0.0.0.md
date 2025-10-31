## v0.0.0 — Phase 0 baseline

F1 Track Linker **demo baseline** as shipped on `main` before roadmap Phases 1–7.

### Highlights

- Strategic README framing (validation lab, visual asset management, Atlassian multi-modal value)
- Setup and install steps in `SETUP.txt`
- Interactive track map in a Forge Frame (D3)
- Brush selection and Jira issue creation with track section details
- GeoJSON upload to Forge app storage
- Sample Silverstone and Yas Marina GeoJSON under `resources/tracks/`

### Roadmap

Development continues in phases; see `.cursor/plans/f1-issue-centric-roadmap.plan.md` and [VERSIONING.md](VERSIONING.md).

### Setup

1. Download source or `git checkout v0.0.0`
2. `npm install` and build `resources/track-viewer`
3. Set your `app.id` in `manifest.yml`
4. `forge deploy` and `forge install`

Full steps: [SETUP.txt](SETUP.txt)
