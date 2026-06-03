import { buildSelectionSummary, formatSelectionDetails } from '../selection-format';
import type { TrackSelectionPayload } from '../../types/track-selection';

const sampleSelection: TrackSelectionPayload = {
  viewport: { x: 10.5, y: 20.25, width: 100, height: 50, scale: 1.5 },
  screenCoords: { x: 12.7, y: 34.2, width: 80, height: 40 },
  geoCoords: {
    topLeft: [51.5, -0.12],
    bottomRight: [51.51, -0.11],
  },
  trackProperties: { name: 'Club' },
};

describe('selection-format', () => {
  it('formatSelectionDetails includes viewport and geo coordinates', () => {
    const details = formatSelectionDetails(sampleSelection);
    expect(details).toContain('Track section details:');
    expect(details).toContain('x: 10.50');
    expect(details).toContain('top left: 51.5000, -0.1200');
    expect(details).toContain('Club');
  });

  it('buildSelectionSummary produces display strings', () => {
    const summary = buildSelectionSummary(sampleSelection);
    expect(summary.viewport).toContain('scale: 1.50');
    expect(summary.screen).toContain('width: 80');
    expect(summary.geo).toContain('Top left:');
    expect(summary.trackProps).toContain('Club');
  });
});
