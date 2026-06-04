import type { AppendTrackLinkInput } from '../../infrastructure/storage/track-link-storage';
import type { LinkSelectionToIssueRequest } from '../../types';

export const selectionToLinkEntry = (
  request: LinkSelectionToIssueRequest,
): AppendTrackLinkInput => ({
  circuitId: request.circuitId,
  viewport: request.viewport,
  trackRelative: request.trackRelative,
  geo: request.geo,
  sampledPoints: request.sampledPoints,
});
