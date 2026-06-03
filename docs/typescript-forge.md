# TypeScript and Forge typings

## What we use today

- **Official SDK types** ship with `@forge/api`, `@forge/bridge`, `@forge/react`, and `@forge/resolver` (no separate `@types/forge` package).
- **Local CI**: `npm run type-check` uses [`tsconfig.json`](../tsconfig.json); ESLint uses [`tsconfig.eslint.json`](../tsconfig.eslint.json) so tests are included.
- **App types**: [`src/types/`](../src/types/) for resolver payloads and track data; [`src/types/forge-context.ts`](../src/types/forge-context.ts) maps [jira:issueAction extension data](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-action/) onto `FullContext` from `@forge/bridge`.
- **Resolvers**: use `Request<T>` from `@forge/resolver`, not a custom request wrapper.

## [CHANGE-2652](https://developer.atlassian.com/platform/forge/changelog/#CHANGE-2652) — TypeScript bundler (EAP)

Forge documents an **Early Access Program** to set `bundler: typescript` in `manifest.yml` so deploy uses **your** TypeScript version and `tsconfig.json` instead of the default Webpack bundler. See the [manifest `bundler` field](https://developer.atlassian.com/platform/forge/manifest-reference/).

**This repo does not enable that EAP** because:

- EAP is **not supported for production** (Runs on Atlassian / Marketplace expectations).
- UI Kit still bundles via Forge; `@forge/react` and `@forge/bridge` are not packaged into backend functions either way.
- The Frame viewer ([`resources/track-viewer/`](../resources/track-viewer/)) already uses its own webpack build.

When the TypeScript bundler graduates from EAP, re-evaluate for backend-only compile alignment with `npm run type-check`.

## Possible follow-ups

- Tighten `strict` in `tsconfig.json` incrementally.
- Typed `invoke` wrappers per resolver name (bridge `InvokeResponse` remains broad).
- Register for CHANGE-2652 EAP on a branch if you want to experiment with `bundler: typescript` for resolver code only.
