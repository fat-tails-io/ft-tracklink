## v0.0.2 — Phase 2 ADS UI Kit shell

This release polishes **everything outside the track map Frame** so the app matches Jira in light and dark theme. Core behaviour is unchanged from `v0.0.1`: upload GeoJSON, brush-select, create a Jira issue with thumbnail.

### What moved out of the Frame

| Before (Phase 0–1) | After (Phase 2) |
|--------------------|-----------------|
| Pan / Brush buttons inside D3 viewer | UI Kit `ButtonGroup` above `<Frame>` |
| Status text in Frame footer | UI Kit status line (`color.text.subtle`) |
| Plain boxes and warning background | ADS tokens, `SectionMessage`, `Label` |

Frame ↔ UI Kit events:

- `VIEWER_SET_MODE` — UI Kit → Frame (`pan` | `brush`)
- `VIEWER_STATUS` — Frame → UI Kit (load, brush, reset messages)

### Verify in Jira

1. **Global page** and **issue action** — toggle Jira light/dark; panels, warnings, and modals should stay readable.
2. **Map toolbar** — Pan/Zoom vs Brush Select only above the map (not inside the canvas).
3. **Upload modal** — validation flags (error/success).
4. **Empty states** — no track, no selection, create issue without selection.

### Next

Phase 3 — multi-circuit catalog and picker.
