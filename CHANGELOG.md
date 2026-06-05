# Changelog

All notable releases are tagged on GitHub. Version numbers follow [VERSIONING.md](VERSIONING.md) (patch digit = roadmap phase).

## [0.0.6] — Phase 6 Jira custom fields

**Tag:** `v0.0.6`  
**Roadmap:** Phase 6 — Circuit and segment visible on the issue view without opening Track Linker

### Added

- **Manifest** — Three app-owned `jira:customField` modules: **F1 Circuit**, **F1 Segment**, **F1 Track links**; scope `write:app-data:jira`
- **Field writes** — [`jira-service.ts`](src/domain/services/jira-service.ts) `updateTrackCustomFields` via `POST /rest/api/3/app/field/value` (`asApp`), numeric `issueIds`
- **Field ID resolution** — [`resolve-forge-field-id.ts`](src/domain/track-link/resolve-forge-field-id.ts) maps manifest module keys to Jira `customfield_*` ids via `GET /rest/api/3/field`
- **Domain** — [`build-custom-field-values.ts`](src/domain/track-link/build-custom-field-values.ts), shared [`track-link-format.ts`](src/domain/track-link/track-link-format.ts)
- **Link flow** — [`persist-issue-track-link.ts`](src/domain/track-link/persist-issue-track-link.ts) updates fields from the **latest** KVS link after each successful link (skips `unknown` circuit); returns `customFieldsUpdated` / `customFieldsWarning`
- **Tests** — `build-custom-field-values.test.ts`, `resolve-forge-field-id.test.ts`
- **CI** — `npm run audit` (high severity) for root app and `resources/track-viewer`, included in `npm run ci`

### Changed

- **Issue action UX** — After linking, selection jumps to the newest segment; saved-segments list is **newest-first** with a **Latest** label
- **`useIssueTrackContext.refresh`** — Supports `preferNewest` / `selectLinkId`; highlight still runs after circuit change via existing effect
- **`useIssueTrackActions`** — Surfaces `customFieldsWarning` when field write fails (link still succeeds)
- **Dependencies** — `@typescript-eslint/*` v8.60.1; `uuid` override `^11.1.1`; track-viewer webpack/babel audit fixes

### Unchanged / deferred

- **Same-circuit multi-segment overlay** on one map view (future phase)
- Backfill custom fields on issues that already have KVS links (values set on next link)
- `jira:issueGlance` deep link from issue view
- **Issue action mop-up** (performance + layout) — [phase-5-issue-action-mopup.plan.md](.cursor/plans/phase-5-issue-action-mopup.plan.md)
- **Post-v1 UI consolidation** — [post-v1-ui-consolidation.plan.md](.cursor/plans/post-v1-ui-consolidation.plan.md)

### Install note

```bash
npm run ci
npm run forge:deploy
npm run forge:install:upgrade
```

Add **F1 Circuit**, **F1 Segment**, and **F1 Track links** to your FT issue screen in Jira admin. Re-consent may be required for `write:app-data:jira`.

For a fuller walkthrough, see [RELEASE_NOTES_v0.0.6.md](RELEASE_NOTES_v0.0.6.md).

---

## [0.0.0] — Phase 0 baseline

**Tag:** `v0.0.0`  
**Roadmap:** Phase 0 — existing codebase on GitHub (demo)

### Included

- Strategic README framing (validation lab, visual asset management, Atlassian multi-modal value)
- Setup and install steps in `SETUP.txt`
- Forge UI Kit app with global page and issue action modules
- Frame-based track viewer (D3 canvas, pan/zoom, brush select)
- Single `track-geojson` KVS key; GeoJSON upload modal
- Create Jira issue from brush selection with thumbnail attachment
- Sample circuits under `resources/tracks/`

### Install note

Replace `REPLACE-WITH-APP-ID` in `manifest.yml` with your Forge app id before deploy.

---

## [0.0.1] — Phase 1 foundation refactor

**Tag:** `v0.0.1`  
**Roadmap:** Phase 1 — Foundation refactor (structure for later phases; same demo as 0.0.0)

### Changed

- Split Phase 0 monolith [`src/frontend/index.tsx`](src/frontend/index.tsx) into routed entry: [`GlobalTrackLinker.tsx`](src/frontend/GlobalTrackLinker.tsx), [`IssueTrackLinker.tsx`](src/frontend/IssueTrackLinker.tsx), shared [`TrackLinkerShell.tsx`](src/frontend/TrackLinkerShell.tsx)
- [`useIssueProductContext`](src/frontend/hooks/useIssueProductContext.ts) — Forge `useProductContext` for issue/project keys on `jira:issueAction`
- [`useTrackLinkerCore`](src/frontend/hooks/useTrackLinkerCore.ts) — shared Frame events, track load, selection state
- [`useCreateIssueFromSelection`](src/frontend/hooks/useCreateIssueFromSelection.ts) + [`CreateIssuePanel`](src/frontend/components/CreateIssuePanel.tsx) / [`SelectionSummaryPanel`](src/frontend/components/SelectionSummaryPanel.tsx)
- Removed unused `IssueCreationModal` and `SvgUploadModal`; removed debug logging from live paths
- Jest scaffold for storage helpers, selection formatting, and Forge context helpers
- ESLint uses [`tsconfig.eslint.json`](tsconfig.eslint.json) so `__tests__` are type-checked; `npm run ci` passes
- **TypeScript / Forge typings** — aligned with official SDK types and [CHANGE-2652](https://developer.atlassian.com/platform/forge/changelog/#CHANGE-2652) direction (local `tsc` + your `tsconfig`, not the TypeScript bundler EAP): `Request<T>` from `@forge/resolver`, typed `invoke<CreateTrackIssueResponse>`, [`forge-context.ts`](src/types/forge-context.ts) for [jira:issueAction](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-action/) extension fields; see [docs/typescript-forge.md](docs/typescript-forge.md)

### Unchanged (by design)

- Same user-facing demo: upload GeoJSON, brush select, create Jira issue with thumbnail
- Single `track-geojson` KVS key; same resolvers and Frame viewer
- No link-to-current issue, circuit catalog, or ADS shell polish (Phases 2–5)

### Install note

Replace `REPLACE-WITH-APP-ID` in `manifest.yml` with your Forge app id before deploy. Build `resources/track-viewer` per [SETUP.txt](SETUP.txt).

For why this refactor happened, see [RELEASE_NOTES_v0.0.1.md](RELEASE_NOTES_v0.0.1.md).

---

## [0.0.2] — Phase 2 ADS UI Kit shell

**Tag:** `v0.0.2`  
**Roadmap:** Phase 2 — Atlassian Design System polish for UI Kit chrome (same demo behaviour as 0.0.1)

### Changed

- **ADS shell** — [`TrackLinkerShell.tsx`](src/frontend/TrackLinkerShell.tsx) uses semantic design tokens (`xcss`: `elevation.surface`, `color.background.neutral`, `color.text.subtle`, etc.), `SectionMessage` for empty track and panel states, `ButtonGroup` for map modes, `Label` on forms
- **Theme** — [`useAppTheme`](src/frontend/hooks/useAppTheme.ts) (product context `theme.colorMode`) re-mounts entry views when Jira light/dark changes so tokenized UI stays in sync
- **Map controls in UI Kit** — Pan/Zoom and Brush Select moved above `<Frame>` via [`ViewerMapControls.tsx`](src/frontend/components/ViewerMapControls.tsx); Frame listens for `VIEWER_SET_MODE` ([`viewer.js`](resources/track-viewer/src/viewer.js))
- **Status line in UI Kit** — [`ViewerStatusLine.tsx`](src/frontend/components/ViewerStatusLine.tsx); Frame emits `VIEWER_STATUS` instead of in-Frame `.status-bar`
- **Panels** — [`SelectionSummaryPanel`](src/frontend/components/SelectionSummaryPanel.tsx) and [`CreateIssuePanel`](src/frontend/components/CreateIssuePanel.tsx) use structured headings and `SectionMessage` empty states
- **Upload modal** — Tokenized layout, `Label` fields, `showFlag` with `appearance` for success/error
- **Issue context** — [`IssueContextBanner.tsx`](src/frontend/components/IssueContextBanner.tsx) with `SectionMessage` when issue key is missing
- **Shared styles** — [`src/frontend/styles/shell-xcss.ts`](src/frontend/styles/shell-xcss.ts)

### Unchanged (by design)

- Same demo: single `track-geojson` KVS, brush select, create Jira issue with thumbnail
- No circuit catalog, arc-length sampling, or link-to-current issue (Phases 3–5)
- Frame canvas styling not tokenized (deferred to Phase 4 / optional follow-up)

### Install note

Replace `REPLACE-WITH-APP-ID` in `manifest.yml` with your Forge app id before deploy. Rebuild `resources/track-viewer` after pull.

---

## [0.0.3] — Phase 3 multi-circuit library

**Tag:** `v0.0.3`  
**Roadmap:** Phase 3 — Circuit catalog, picker, and per-circuit GeoJSON storage

### Added

- **Circuit catalog KVS** — `circuit-catalog` index plus `track-geojson-{circuitId}` geometry keys ([`circuit-catalog-storage.ts`](src/infrastructure/storage/circuit-catalog-storage.ts))
- **Resolvers** — `listCircuits`, `getCircuitGeoJson`, `seedCircuitLibrary`, `setLastCircuit`, `deleteCircuit` ([`track-linker-resolver.ts`](src/resolvers/track-linker-resolver.ts))
- **Bundled circuits** — Silverstone (`gb-1948`) and Yas Marina (`ae-2009`) seeded on first load from [`src/data/tracks/`](src/data/tracks/) with enriched `corner` Point features
- **UI** — [`CircuitPicker`](src/frontend/components/CircuitPicker.tsx) at top of [`TrackLinkerShell`](src/frontend/TrackLinkerShell.tsx); last-used circuit persisted via `setLastCircuit`
- **Upload** — Custom circuits require `circuitId`; catalog entry updated on save ([`GeoJsonUploadModal.tsx`](src/frontend/components/GeoJsonUploadModal.tsx))
- **Viewer** — Corner markers drawn for `role: corner` features ([`viewer.js`](resources/track-viewer/src/viewer.js))

### Changed

- **Migration** — Legacy single `track-geojson` key copied into catalog on read/seed, then removed
- **`getTrackGeoJson` / `saveTrackGeoJson`** — Require `circuitId` (or `trackId` alias) for writes; reads resolve last-used or catalog default
- **Forge bundle** — Bundled tracks imported as [`src/data/tracks/*.json`](src/data/tracks/) (`.geojson` imports fail Forge deploy webpack)
- **Create-issue form** — Summary and description refresh on new brush; **Reset view**, circuit change, and **Clear selection** reset form defaults ([`useCreateIssueFromSelection`](src/frontend/hooks/useCreateIssueFromSelection.ts))

### Unchanged (by design)

- Brush still uses map rectangle → geo corners (arc-length / `trackRelative` in Phase 4)
- No link-to-current issue or Jira custom fields (Phases 5–6)

### Install note

Set your Forge `app.id` in [`manifest.yml`](manifest.yml). Build and deploy:

```bash
npm run build
npm run forge:deploy
npm run forge:install:upgrade
```

Sync authoring GeoJSON to bundle JSON before deploy when adding bundled circuits (see [`src/data/tracks/README.md`](src/data/tracks/README.md)).

For a fuller walkthrough, see [RELEASE_NOTES_v0.0.3.md](RELEASE_NOTES_v0.0.3.md).

---

## [0.0.4] — Phase 4 high-precision track sampling

**Tag:** `v0.0.4`  
**Roadmap:** Phase 4 — Arc-length brush selection, FastF1-enriched bundled circuits, track data licensing

### Added

- **Layer 2 track data** — Offline FastF1/MultiViewer ETL ([`tools/transpose-circuit-detail.py`](tools/transpose-circuit-detail.py), [`requirements-dev.txt`](requirements-dev.txt), [`src/data/fastf1-circuit-map.json`](src/data/fastf1-circuit-map.json)); enriched Silverstone and Yas Marina in [`src/data/tracks/`](src/data/tracks/) (`layer2Source: fastf1-multiviewer`, corners and marshal themes)
- **`track-geometry.js`** — Geodesic densify (~1 m), arc-length index, lenient brush-to-segment, `geoLengthM()` for metre distances
- **Extended selection** — `trackRelative` (`startDistanceM`, `endDistanceM`, `segmentLengthM`), segment geo endpoints, `sampledPoints`; **Along track** row in [`SelectionSummaryPanel`](src/frontend/components/SelectionSummaryPanel.tsx)
- **Frame layout** — [`TrackViewerFrame`](src/frontend/components/TrackViewerFrame.tsx) explicit height and viewer layout sync (fixes cropped map / grey gap below canvas)
- **Track data licensing** — [`LICENSE/fastf1-multiviewer.md`](LICENSE/fastf1-multiviewer.md), root [`LICENSE.md`](LICENSE.md) and README track-data table, [`src/data/tracks/README.md`](src/data/tracks/README.md), collapsible [`DataAttributionNotice`](src/frontend/components/DataAttributionNotice.tsx) on global page and issue action
- **Dev script** — `npm run enrich:tracks` in [`package.json`](package.json)
- **Tests** — [`resources/track-viewer/src/__tests__/track-geometry.test.js`](resources/track-viewer/src/__tests__/track-geometry.test.js)

### Changed

- [`viewer.js`](resources/track-viewer/src/viewer.js) — Brush selects a **segment on the centerline** (track-relative metres), not only a map bounding box
- [`circuit-geojson.ts`](src/domain/circuit/circuit-geojson.ts) — Prefer embedded `role: corner` features from enriched GeoJSON over mock bundled corners

### Unchanged (by design)

- No link-to-current issue or Jira custom fields (Phases 5–6)
- Brush sensitivity admin and use-case selection profiles (documented follow-ups)
- F1 timing sectors (S1/S2/S3) in static catalog — deferred to session/timing work
- Full F1 calendar enrichment — content rollout per circuit, not a version blocker

### Install note

Set your Forge `app.id` in [`manifest.yml`](manifest.yml). Build and deploy:

```bash
npm run build
forge deploy -e development
forge install --upgrade   # if already installed
```

Regenerate enriched tracks locally with `npm run enrich:tracks` (see [`src/data/tracks/README.md`](src/data/tracks/README.md)).

For a fuller walkthrough, see [RELEASE_NOTES_v0.0.4.md](RELEASE_NOTES_v0.0.4.md).

---

## [0.0.5] — Phase 5 issue-centric workflow

**Tag:** `v0.0.5`  
**Roadmap:** Phase 5 — Link track segments to the current Jira issue (issue action primary path)

### Added

- **Issue action linking** — [`IssueLinkPanel`](src/frontend/components/IssueLinkPanel.tsx): primary **Link to {issueKey}**, **Create subtask** with segment, saved-segments list
- **Resolvers** — `linkSelectionToIssue` (thumbnail + ADF **comment** + append KVS link), `createLinkedTrackIssue` (**Subtask** under parent), `getIssueTrackContext`
- **Multi-link storage** — Up to **10** segments per issue (`IssueTrackLinks.links[]`); legacy single `TrackSection` migrated on read
- **Viewer restore** — `HIGHLIGHT_SEGMENT` + `selectSegmentFromDistanceRange` in [`track-geometry.js`](resources/track-viewer/src/track-geometry.js)
- **Bootstrap** — Issue action loads **most recent valid** linked circuit once; manual circuit picker is not overridden ([`issue-circuit-bootstrap.ts`](src/frontend/utils/issue-circuit-bootstrap.ts))
- **Domain** — [`persist-issue-track-link.ts`](src/domain/track-link/persist-issue-track-link.ts), [`track-link-comment.ts`](src/domain/track-link/track-link-comment.ts) (ADF comment body)
- **Tests** — Storage cap/migration, comment ADF builder, circuit bootstrap helper

### Changed

- [`IssueTrackLinker.tsx`](src/frontend/IssueTrackLinker.tsx) — Replaces create-issue-only flow on issue action; uses `accountId` for catalog/geo load
- [`createTrackIssue`](src/resolvers/track-linker-resolver.ts) — May store `circuitId`, `trackRelative`, and geo on new issues when provided
- [`IssueContextBanner`](src/frontend/components/IssueContextBanner.tsx) — Shows issue summary from context

### Unchanged (by design)

- Jira **custom fields** (Phase 6); global page still supports standalone create-issue
- Option C dual persistence (comment + description/fields) — see Phase 5 cleanup in roadmap
- **Issue action mop-up** (performance + layout polish) — [phase-5-issue-action-mopup.plan.md](.cursor/plans/phase-5-issue-action-mopup.plan.md)
- Delete/edit link UI; Relates fallback when parent cannot take subtasks

### Install note

```bash
npm run build
forge deploy -e development
forge install --upgrade   # if already installed
```

Parent issue type must support **Subtask** for “Create subtask with segment” (e.g. project FT).

For a fuller walkthrough, see [RELEASE_NOTES_v0.0.5.md](RELEASE_NOTES_v0.0.5.md).

---

Future phases: `v0.0.7` … `v0.0.8`, then `v1.0.0` when the full roadmap ships.
