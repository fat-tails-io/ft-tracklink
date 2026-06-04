## v0.0.4 — Phase 4 High-precision track sampling

This release delivers **track-relative brush selection**: drag on the circuit centerline and get `startDistanceM` / `endDistanceM` in metres, high-precision WGS84 endpoints, and optional sampled points for Jira descriptions. Bundled Silverstone and Yas Marina include **FastF1/MultiViewer-derived** corner and marshal detail (offline ETL, transposed onto f1-circuits centerlines). The map Frame fills its shell correctly, and **Track data** attribution is shown in the UI (collapsed by default).

### What's new

| Area | Behaviour |
|------|-----------|
| **Geometry** | [`track-geometry.js`](resources/track-viewer/src/track-geometry.js) — densify, arc-length index, lenient brush hit-testing, `geoLengthM()` |
| **Selection payload** | `trackRelative`, segment `geo`, `sampledPoints` on `TRACK_SECTION_SELECTED` |
| **Bundled data** | Enriched `gb-1948`, `ae-2009` with `layer2Source: fastf1-multiviewer` |
| **ETL (dev only)** | `tools/transpose-circuit-detail.py`, `npm run enrich:tracks` |
| **Licensing** | `LICENSE/fastf1-multiviewer.md`, README + in-app collapsible attribution |
| **Layout** | `TrackViewerFrame` 600px height; viewer layout sync |

### Verify in Jira

1. Open global page or issue action — pick **Silverstone** or **Yas Marina**; map shows centerline and corner markers.
2. **Brush Select** — drag along a straight; **Along track** shows non-zero metres (e.g. `1240.0 m – 1580.0 m`).
3. Create-issue **Description** includes track-relative line when selection exists.
4. Scroll to **Track data** — collapsed summary; **Show attribution details** expands f1-circuits + FastF1/MultiViewer credits.
5. Switch circuit — map reloads; brush still works on the new track.

### Deploy

```bash
npm run build
npm run forge:deploy
npm run forge:install:upgrade   # if already installed
```

### Next

Phase 5 — link selection to the current issue (persist `trackRelative`, circuit id, thumbnail on the issue).
