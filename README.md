# ft-tracklink - Validation Integration of Visual Assets for New Use Cases (Atlassian)

`ft-tracklink` exists to validate a delivery strategy, not to showcase a hobby demo.

This repository is a **Strategic Validation Lab**: practical evidence that leadership-level technology decisions can be tested close to implementation detail before they become portfolio-level delivery risk. It demonstrates hands-on capability as a senior director by combining commercial intent, operating model choices, and real Atlassian platform execution.

## Why This Exists

- **Empirical leadership proof**: validates that strategic decisions are grounded in executable engineering, not slideware.
- **Delivery-risk reduction**: surfaces integration, handoff, and precision risks early inside the Atlassian ecosystem.
- **Reusable commercial pattern**: tests a repeatable method for translating complex visual domain context into trackable Jira work.

## Problem Framing: Visual Asset Management and Requirements Precision

The core business problem is not motorsport-specific. It is a common **requirements specification** challenge in physical or visual domains: provide a precise location on an asset into an unambiguous work item.

F1 is used as a high-precision example where location language is explicit and operationally meaningful (for example, a specific corner entry, apex, or exit segment). If a team can define and capture work at that level of detail, the same pattern may transfer to other asset-intensive, language-specific domains.

Furthermore, this aligns with Atlassian's multi-modal collaboration model. Teams may use tools such as **Rovo chat/audio** to express nuanced location language, map that language into structured Jira work items linked to (geographic) coordinates and visual evidence.

## Strategic Value in the Atlassian Ecosystem

- **Better teamwork and productivity**: multi-modal input (chat + audio) reduces ambiguity during cross-functional handoffs.
- **Stronger requirement quality**: location-aware issue creation improves precision and acceptance criteria clarity.
- **Faster triage and execution**: visual context plus linked work items shortens clarification cycles.
- **Auditable collaboration trail**: conversation context, coordinate selection, and Jira artifacts are captured in one workflow.

## Features

- **Interactive SVG Track Viewer**: Pan/zoom controls (d3-zoom) for precise visual navigation
- **Track Section Selection**: Brush selection (d3-brush) with location context summary
- **Work Item Context Form**: Create a Jira work item linked to the selected coordinates
- **Thumbnail Generation**: Automatically attach selection evidence to the Jira work item

## Architecture

### Frontend

- **UI Kit**: Main app interface using Forge UI Kit components
- **Frame Component**: Custom UI component for SVG interaction with d3.js
- **Events API**: Bidirectional communication between UI Kit and Frame

### Backend

- **Resolvers**: Create work items from track context, attach visual selection thumbnails, and persist linkages
- **Jira Service**: Service layer for creating issues and attaching files
- **Storage Service**: Key-Value Store operations for track links and SVG files

Setup and installation instructions: [SETUP.txt](SETUP.txt)

## Development

### Project Structure

Structure reflects what is currently committed, this is subject to change.

```
jest.config.js              # Jest config
manifest.yml                # Forge app manifest
package.json
package-lock.json
README.md
tsconfig.json               # TypeScript config

src/
├── index.ts                      # Resolver exports
├── resolvers/
│   └── track-linker-resolver.ts  # Backend resolvers
├── domain/
│   └── services/
│       └── jira-service.ts       # JIRA API integration
├── infrastructure/
│   └── storage/
│       └── track-link-storage.ts # KVS operations
├── types/
│   └── index.ts                  # Shared types
└── frontend/
    ├── index.tsx                 # Routes global vs issue action entry
    ├── TrackLinkerShell.tsx      # Shared layout + Frame
    ├── GlobalTrackLinker.tsx     # jira:globalPage
    ├── IssueTrackLinker.tsx      # jira:issueAction (useProductContext)
    ├── hooks/                    # Track viewer + issue context hooks
    └── components/
        ├── GeoJsonUploadModal.tsx
        ├── SelectionSummaryPanel.tsx
        └── CreateIssuePanel.tsx

resources/
└── track-viewer/                 # Frame component (d3.js)
    ├── package.json
    ├── webpack.config.js
    └── src/
        ├── index.html            # Frame entry HTML
        ├── viewer.js             # D3 track viewer (zoom, brush, canvas)
        └── styles.css            # Frame styles
```

## Releases

Version tags follow the F1 roadmap: **`v0.0.N` = Phase N** (for example `v0.0.0` is the Phase 0 baseline). **`v1.0.0`** will mark the complete product after Phase 7.

- Download any version: [GitHub Releases](https://github.com/fat-tails-io/ft-tracklink/releases)
- Scheme and maintainer steps: [VERSIONING.md](VERSIONING.md)
- Per-release notes: [CHANGELOG.md](CHANGELOG.md)

## License

[MIT](LICENSE.md)
