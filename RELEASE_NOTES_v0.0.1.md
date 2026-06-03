## v0.0.1 — Phase 1 foundation refactor

This release is a **structural refactor**, not a new product capability. If you used `v0.0.0`, you get the **same demo** after install: global page and issue action, D3 track viewer, GeoJSON upload, brush selection, create Jira issue with thumbnail.

### Why Phase 1 was necessary

Phase 0 shipped a working prototype in one file (~420 lines in `index.tsx`). Both Forge modules (`jira:globalPage` and `jira:issueAction`) rendered the **same** UI, with no distinction for issue context and no clear place to add roadmap features without editing that monolith again.

Later phases need separate extension points:

| Phase | Needs from frontend structure |
|-------|-------------------------------|
| 2 — ADS | One shell to tokenize; move map controls out of Frame |
| 3 — Catalog | Circuit picker in shared chrome |
| 4 — Sampling | Richer selection payload + tested geometry helpers |
| 5 — Issue-centric | Issue action hero path: link to **current** issue, restore segment |
| 6–7 — Fields / Rovo | Same domain layer as UI |

Phase 1 establishes those boundaries **before** those features land.

### What changed structurally

```text
Phase 0:  index.tsx (everything)
Phase 1:  index.tsx (router)
          ├── GlobalTrackLinker
          ├── IssueTrackLinker (+ useProductContext)
          └── TrackLinkerShell (Frame + upload)
                hooks: useTrackLinkerCore, useCreateIssueFromSelection
                panels: SelectionSummaryPanel, CreateIssuePanel
```

- **Entry routing** — Issue action loads `IssueTrackLinker` (issue key, project pre-fill when Forge provides context). Global page loads `GlobalTrackLinker`.
- **Shared chrome** — `TrackLinkerShell` owns layout, Frame, and upload modal wiring once.
- **Viewer orchestration** — `useTrackLinkerCore` centralizes `FRAME_READY`, `GEOJSON_LOAD`, `TRACK_SECTION_SELECTED`, and track load.
- **Jira create path** — `useCreateIssueFromSelection` and `CreateIssuePanel` isolate create-issue behavior (Phase 5 will add link/create variants beside this).
- **Hygiene** — Removed unused modals and debug noise; added Jest tests for storage and selection formatting.
- **TypeScript and Forge typings** — CI now runs `type-check`, ESLint, and Jest together. Resolver handlers use `Request<T>` from `@forge/resolver`; the UI uses typed `invoke` for create-issue responses. Issue-action context is mapped via [`src/types/forge-context.ts`](src/types/forge-context.ts) to the documented `jira:issueAction` extension shape (`issue.key`, `project.key`, etc.). This follows the same principle as Atlassian’s [CHANGE-2652](https://developer.atlassian.com/platform/forge/changelog/#CHANGE-2652) (TypeScript bundler EAP): **your** TypeScript version and config drive compile-time checks in development. This release does **not** enable `bundler: typescript` in `manifest.yml` (EAP, not for production); see [docs/typescript-forge.md](docs/typescript-forge.md).

### What did not change

- Backend resolvers and single `track-geojson` storage model
- Frame viewer (`resources/track-viewer`) behavior
- Primary action is still **create a new issue** from a brush selection (not link-to-current — Phase 5)

### Install (same as v0.0.0)

1. `npm install` and build `resources/track-viewer` (see [SETUP.txt](SETUP.txt))
2. Set `REPLACE-WITH-APP-ID` in `manifest.yml` to your Forge app id
3. `forge deploy` and `forge install`
