# Bundled track catalog (`src/data/tracks/`)

GeoJSON FeatureCollections shipped in the Forge function bundle (imported as `.json` because Forge webpack does not bundle `.geojson` reliably).

## Two data layers

| Layer | Source | Files | License |
| ----- | ------ | ----- | ------- |
| **1. Base centerline** | [f1-circuits](https://github.com/bacinger/f1-circuits) WGS84 | `role: centerline` | MIT — [`LICENSE/f1-circuits.md`](../../../LICENSE/f1-circuits.md) |
| **2. F1 detail** | FastF1 `CircuitInfo` (MultiViewer API, offline ETL) | `role: corner`, `marshal_*`, optional `centerline_detail` | See [`LICENSE/fastf1-multiviewer.md`](../../../LICENSE/fastf1-multiviewer.md) |

Enriched circuits set `properties.layer2Source: "fastf1-multiviewer"` and `accuracyTier: "operational"`. Detail coordinates are **transposed** onto the f1-circuits centerline—they are not raw FastF1 `X`/`Y`.

## Regenerate enriched tracks (dev only)

Requires Python 3 and a local venv (not deployed to Forge):

```bash
python3 -m venv .venv-dev
.venv-dev/bin/pip install -r requirements-dev.txt
npm run enrich:tracks
```

- ETL: [`tools/transpose-circuit-detail.py`](../../../tools/transpose-circuit-detail.py)
- Circuit → session map: [`src/data/fastf1-circuit-map.json`](../fastf1-circuit-map.json)
- Authoring output (gitignored): `resources/tracks/{circuitId}.geojson` — copy into this folder as `{circuitId}.json` before deploy.

## Attribution in the app

Users see a **Track data** notice in the Track Linker UI (global page and issue action). Full legal text lives under [`LICENSE/`](../../../LICENSE/).
