## v0.0.3 — Phase 3 Multi-circuit library

This release adds a **first-class circuit catalog**: pick Silverstone or Yas Marina from a dropdown, seed bundled tracks on first load, and upload custom circuits into the same index. Brush-select and create-issue behaviour from `v0.0.2` is unchanged; arc-length sampling and link-to-current issue remain Phase 4–5.

### What’s new

| Area | Behaviour |
|------|-----------|
| **Catalog** | KVS keys `circuit-catalog` + `track-geojson-{circuitId}`; legacy `track-geojson` migrated on seed/read |
| **Bundled tracks** | `gb-1948` (Silverstone), `ae-2009` (Yas Marina) — centerline + seeded `corner` points for map/Rovo prep |
| **UI** | Circuit `Select` at top of shell; **Add custom circuit** writes catalog + geometry |
| **Viewer** | Red corner markers for `role: corner` features |
| **Deploy** | Bundled assets ship as `.json` under `src/data/tracks/` (Forge webpack cannot import `.geojson`) |

### Resolvers

- `listCircuits` — catalog metadata + last-used circuit
- `getCircuitGeoJson` — geometry for one `circuitId`
- `seedCircuitLibrary` — idempotent bundled seed (`forceGeo` optional)
- `setLastCircuit` — persist picker choice
- `deleteCircuit` — admin removal

### UX refinements (same tag)

- **Create Jira issue form** — summary/description reset on each new brush, circuit change, **Reset view**, and **Clear selection** (avoids stale Silverstone text when switching to Yas Marina).
- **Sync tracks for deploy** — after editing `resources/tracks/*.geojson`, copy to `src/data/tracks/*.json` (see [`src/data/tracks/README.md`](src/data/tracks/README.md)).

### Verify in Jira

1. Open global page or issue action — **Circuit** dropdown lists at least Silverstone and Yas Marina.
2. Switch circuit — map reloads; corner dots visible when zoomed.
3. Brush-select on circuit A, then B — create-issue **Summary** matches the active circuit name.
4. **Reset view** — clears brush and resets create-issue fields (project key preserved on issue action).
5. **Add custom circuit** — upload appears in dropdown after save.

### Deploy

```bash
npm run forge:deploy
npm run forge:install:upgrade   # if already installed
```

### Next

Phase 4 — high-precision track sampling (`startDistanceM`, brush-to-segment on centerline).
