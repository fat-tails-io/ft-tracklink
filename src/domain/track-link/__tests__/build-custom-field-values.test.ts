import {
  buildCustomFieldValues,
  shouldWriteTrackCustomFields,
} from '../build-custom-field-values';
import type { TrackLinkEntry } from '../../../types';

const baseLink = (overrides: Partial<TrackLinkEntry> = {}): TrackLinkEntry => ({
  linkId: 'link-1',
  linkIndex: 0,
  circuitId: 'gb-1948',
  viewport: { x: 0, y: 0, width: 100, height: 100, scale: 1 },
  trackRelative: {
    startDistanceM: 1240.5,
    endDistanceM: 1580.2,
    segmentLengthM: 339.7,
    totalCircuitLengthM: 5891,
  },
  geo: { start: [0, 0], end: [1, 1] },
  createdAt: 1,
  ...overrides,
});

describe('buildCustomFieldValues', () => {
  it('formats circuit with display name and segment metres', () => {
    const values = buildCustomFieldValues({
      latestLink: baseLink(),
      linkCount: 1,
      circuitDisplayName: 'Silverstone Circuit',
    });

    expect(values.circuit).toBe('Silverstone Circuit (gb-1948)');
    expect(values.segment).toBe('1241–1580 m');
    expect(values.linksSummary).toBe('');
  });

  it('includes links summary when more than one segment', () => {
    const values = buildCustomFieldValues({
      latestLink: baseLink({ linkIndex: 2 }),
      linkCount: 3,
    });

    expect(values.linksSummary).toBe('3 segments');
  });

  it('uses circuit id only when no display name', () => {
    const values = buildCustomFieldValues({
      latestLink: baseLink({ circuitId: 'ae-2009' }),
      linkCount: 2,
    });

    expect(values.circuit).toBe('ae-2009');
    expect(values.linksSummary).toBe('2 segments');
  });
});

describe('shouldWriteTrackCustomFields', () => {
  it('rejects unknown and empty circuit ids', () => {
    expect(shouldWriteTrackCustomFields('unknown')).toBe(false);
    expect(shouldWriteTrackCustomFields('')).toBe(false);
    expect(shouldWriteTrackCustomFields('gb-1948')).toBe(true);
  });
});
