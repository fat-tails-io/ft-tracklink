# Changelog

All notable releases are tagged on GitHub. Version numbers follow [VERSIONING.md](VERSIONING.md) (patch digit = roadmap phase).

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

Future phases: `v0.0.3` … `v0.0.8`, then `v1.0.0` when the full roadmap ships.
