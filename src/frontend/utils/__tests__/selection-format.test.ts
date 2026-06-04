import { buildSelectionSummary, formatSelectionDetails } from '../selection-format';
import type { TrackSelectionPayload } from '../../types/track-selection';

const sampleSelection: TrackSelectionPayload = {
  viewport: { x: 10.5, y: 20.25, width: 100, height: 50, scale: 1.5 },
  screenCoords: { x: 12.7, y: 34.2, width: 80, height: 40 },
  geoCoords: {
    topLeft: [-0.12, 51.5],
    bottomRight: [-0.11, 51.51],
    start: [-0.12, 51.5],
    end: [-0.11, 51.51],
  },
  geo: {
    start: [-0.12, 51.5],
    end: [-0.11, 51.51],
    precision: 6,
  },
  trackRelative: {
    startDistanceM: 1200.5,
    endDistanceM: 1580.2,
    totalCircuitLengthM: 5891,
    segmentLengthM: 379.7,
  },
  trackProperties: { name: 'Club' },
};

describe('selection-format', () => {
  it('formatSelectionDetails includes viewport and geo coordinates', () => {
    const details = formatSelectionDetails(sampleSelection);
    expect(details).toContain('Track section details:');
    expect(details).toContain('x: 10.50');
    expect(details).toContain('Geo segment');
    expect(details).toContain('Along track');
    expect(details).toContain('1200.5 m');
    expect(details).toContain('Club');
  });

  it('buildSelectionSummary produces display strings', () => {
    const summary = buildSelectionSummary(sampleSelection);
    expect(summary.viewport).toContain('scale: 1.50');
    expect(summary.screen).toContain('width: 80');
    expect(summary.geo).toContain('Start:');
    expect(summary.trackRelative).toContain('1200.5 m');
    expect(summary.trackProps).toContain('Club');
  });

  it('buildSelectionSummary handles legacy selections without trackRelative', () => {
    const legacy: TrackSelectionPayload = {
      viewport: sampleSelection.viewport,
      screenCoords: sampleSelection.screenCoords,
      geoCoords: { topLeft: [-0.12, 51.5], bottomRight: [-0.11, 51.51] },
    };
    const summary = buildSelectionSummary(legacy);
    expect(summary.trackRelative).toContain('legacy');
  });
});
