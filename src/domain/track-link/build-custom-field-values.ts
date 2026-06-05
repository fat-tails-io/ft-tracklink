import {
  formatCircuitDisplay,
  formatSegmentRangeM,
  formatTrackLinksSummary,
} from './track-link-format';
import type { TrackLinkEntry } from '../../types';

export const TRACK_CIRCUIT_FIELD_KEY = 'track-circuit-field';
export const TRACK_SEGMENT_FIELD_KEY = 'track-segment-field';
export const TRACK_LINKS_FIELD_KEY = 'track-links-field';

export type TrackCustomFieldValues = {
  circuit: string;
  segment: string;
  linksSummary: string;
};

export type BuildCustomFieldValuesInput = {
  latestLink: TrackLinkEntry;
  linkCount: number;
  circuitDisplayName?: string;
};

export const buildCustomFieldValues = (
  input: BuildCustomFieldValuesInput,
): TrackCustomFieldValues => {
  const { latestLink, linkCount, circuitDisplayName } = input;

  return {
    circuit: formatCircuitDisplay(latestLink.circuitId, circuitDisplayName),
    segment: formatSegmentRangeM(latestLink) ?? '',
    linksSummary: formatTrackLinksSummary(linkCount),
  };
};

export const shouldWriteTrackCustomFields = (circuitId: string): boolean =>
  Boolean(circuitId) && circuitId !== 'unknown';
