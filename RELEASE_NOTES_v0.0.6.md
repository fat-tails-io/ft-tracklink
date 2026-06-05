## v0.0.6 — Phase 6 Jira custom fields

Circuit, segment, and link count are now visible on the **Jira issue screen** without opening Track Linker. The issue action also defaults to the **newest** saved segment and labels it clearly in the picker.

### What's new

| Area | Behaviour |
|------|-----------|
| **Custom fields** | Three app-owned fields: **F1 Circuit**, **F1 Segment**, **F1 Track links** |
| **Write policy** | Updated from the **latest** KVS link after each successful link (create subtask included) |
| **Field API** | Resolves Forge module keys → Jira `customfield_*` ids; bulk update via app field value API |
| **Multi-link UX** | Saved segments **newest-first**; **Latest** label; post-link jumps to new segment |
| **Resilience** | Link succeeds even if field write fails; UI shows a warning flag |

### Verify in Jira

1. **Admin** — After deploy, add **F1 Circuit**, **F1 Segment**, and **F1 Track links** to your project issue screen (Context or Details).
2. Open an issue → **Track Linker** → brush a segment → **Link to ISSUE-KEY**.
3. Close the action → issue view shows circuit, segment metres, and link count (e.g. `3 segments` when N > 1).
4. Link a second segment → fields update to the **newest** link; reopen action → newest highlighted.
5. Pick an older saved segment → map highlights it; issue fields stay on latest (by design).

### Deploy

```bash
npm run ci
npm run forge:deploy
npm run forge:install:upgrade   # re-consent for write:app-data:jira if prompted
```

### Follow-up (not in this tag)

- **Issue action mop-up** — performance + layout ([`.cursor/plans/phase-5-issue-action-mopup.plan.md`](.cursor/plans/phase-5-issue-action-mopup.plan.md))
- **Post-v1 UI consolidation** — fewer workflow steps ([`.cursor/plans/post-v1-ui-consolidation.plan.md`](.cursor/plans/post-v1-ui-consolidation.plan.md))
- Field backfill for issues linked before v0.0.6
- Same-circuit multi-segment overlay on one map
- Phase 7 — Rovo Chat entry point
