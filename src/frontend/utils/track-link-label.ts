import type { TrackLinkEntry } from '../../types';

export const formatTrackLinkLabel = (link: TrackLinkEntry, circuitName?: string): string => {
  const circuit = circuitName || link.circuitId;
  if (link.trackRelative) {
    return `${circuit}: ${link.trackRelative.startDistanceM.toFixed(0)}–${link.trackRelative.endDistanceM.toFixed(0)} m`;
  }
  return `${circuit}: link ${link.linkIndex + 1}`;
};
