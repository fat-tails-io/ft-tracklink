import type { TrackLinkEntry } from '../../types';

export const formatCircuitDisplay = (
  circuitId: string,
  circuitDisplayName?: string,
): string => {
  if (circuitDisplayName && circuitDisplayName !== circuitId) {
    return `${circuitDisplayName} (${circuitId})`;
  }
  return circuitId;
};

export const formatSegmentRangeM = (link: TrackLinkEntry): string | undefined => {
  if (!link.trackRelative) {
    return undefined;
  }
  const { startDistanceM, endDistanceM } = link.trackRelative;
  return `${startDistanceM.toFixed(0)}–${endDistanceM.toFixed(0)} m`;
};

export const formatTrackLinksSummary = (linkCount: number): string => {
  if (linkCount <= 1) {
    return '';
  }
  return `${linkCount} segments`;
};

export const formatTrackLinkLabel = (link: TrackLinkEntry, circuitName?: string): string => {
  const circuit = circuitName || link.circuitId;
  const range = formatSegmentRangeM(link);
  if (range) {
    return `${circuit}: ${range}`;
  }
  return `${circuit}: link ${link.linkIndex + 1}`;
};
