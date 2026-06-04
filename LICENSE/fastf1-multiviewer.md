# FastF1 / MultiViewer derived track detail (Phase 4)

Bundled and user-synced track files under `src/data/tracks/` (and dev authoring copies under
`resources/tracks/`) may include **Layer 2** geometry beyond the f1-circuits WGS84 centerline.

## What is derived

| Theme (`properties.role`) | Origin |
| ------------------------- | ------ |
| `corner` | FastF1 `CircuitInfo.corners` (MultiViewer API) |
| `marshal_sector`, `marshal_light` | FastF1 `CircuitInfo` marshal data |
| `centerline_detail` | Telemetry `pos` (X, Y, optional Z) transposed onto the base centerline |

Coordinates in committed GeoJSON are **transposed to WGS84** on the f1-circuits centerline. Raw FastF1
normalized `X`/`Y` are not stored as geographic coordinates.

## Software and data sources

1. **[FastF1](https://github.com/theOehrly/Fast-F1)** — MIT License. Used **offline only** in
   [`tools/transpose-circuit-detail.py`](../tools/transpose-circuit-detail.py) (not invoked from Forge
   Lambda). See the FastF1 repository for the full MIT license text.

2. **Circuit information API** — FastF1 loads circuit maps from data originally provided by
   **[MultiViewer](https://multiviewer.app/)**, as documented in the
   [FastF1 CircuitInfo API](https://docs.fastf1.dev/api_reference/circuit_info.html). MultiViewer’s
   maintainers state that crediting them as an F1 data source is appreciated though not required; this
   project includes that credit in the app UI and these license files.

3. **Layer 1 centerlines** — Remain from [f1-circuits](https://github.com/bacinger/f1-circuits); see
   [`f1-circuits.md`](f1-circuits.md).

## Accuracy and use

Derived geometry is **visualization-grade** for operational map display, corner labels, and
metre-scale brush selection in Jira. It is **not** survey-grade and must not be used where
homologation or geodetic survey accuracy is required.

Catalog metadata may include `layer2Source: "fastf1-multiviewer"`, `referenceYear`, and
`referenceEvent` documenting the FastF1 session used for transposition.

## Regeneration

Dev-only: `npm run enrich:tracks` after installing `requirements-dev.txt` into `.venv-dev`.
See [`src/data/tracks/README.md`](../src/data/tracks/README.md).

## Trademarks

Formula 1 and related marks are trademarks of their respective holders. ft-tracklink is not affiliated
with or endorsed by Formula One Licensing BV, MultiViewer, or the FastF1 project.
