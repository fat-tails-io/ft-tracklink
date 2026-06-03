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

Future phases: `v0.0.2` … `v0.0.7`, then `v1.0.0` when the full roadmap ships.
