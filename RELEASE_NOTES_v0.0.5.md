## v0.0.5 — Phase 5 Issue-centric workflow

Issue action is now the primary path: brush a segment on the map and **link it to the open Jira issue** (ADF comment + thumbnail + stored metadata). You can add up to **10** segments per issue, highlight saved segments on the map, or **create a subtask** that carries the same segment data.

### What's new

| Area | Behaviour |
|------|-----------|
| **Link to issue** | `linkSelectionToIssue` — append link in Forge storage + Jira comment (not description edit) |
| **Multi-segment** | `links[]` per issue, max 10; list in UI with “Show on map” |
| **Restore** | `HIGHLIGHT_SEGMENT` — blue overlay for saved `startDistanceM`–`endDistanceM` |
| **Subtask** | `createLinkedTrackIssue` — child **Subtask** under current issue (same project) |
| **Bootstrap** | Opens on most recent **valid** linked circuit; picker choice sticks |
| **Context** | `getIssueTrackContext` — summary + existing links |

### Verify in Jira

1. Open an issue → **Track Linker** action.
2. Brush a segment → **Link to ISSUE-KEY** → Activity shows comment + attachment; **Linked segments: 1/10**.
3. Brush another area → second link appends; select a saved segment → map highlights it.
4. **Create subtask with segment** → new subtask under parent with its own link/comment.
5. Issue with no links → default/last circuit loads; pick a circuit manually — map stays loaded.

### Deploy

```bash
npm run build
npm run forge:deploy
npm run forge:install:upgrade   # if already installed
```

### Follow-up (not in this tag)

- **Issue action mop-up** — performance + layout ([`.cursor/plans/phase-5-issue-action-mopup.plan.md`](.cursor/plans/phase-5-issue-action-mopup.plan.md))
- Phase 6 — Jira custom fields on the issue screen
