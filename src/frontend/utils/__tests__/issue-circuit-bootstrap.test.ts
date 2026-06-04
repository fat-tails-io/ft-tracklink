import { resolveCircuitIdFromLinks } from '../issue-circuit-bootstrap';
import type { TrackLinkEntry } from '../../../types';

const circuits = [
  { id: 'gb-1948', name: 'Silverstone', location: 'Silverstone' },
  { id: 'ae-2009', name: 'Yas Marina', location: 'Yas Marina' },
];

const link = (partial: Partial<TrackLinkEntry> & Pick<TrackLinkEntry, 'linkId' | 'linkIndex'>): TrackLinkEntry => ({
  circuitId: 'gb-1948',
  viewport: { x: 0, y: 0, width: 1, height: 1, scale: 1 },
  createdAt: 1,
  ...partial,
});

describe('resolveCircuitIdFromLinks', () => {
  it('returns most recent valid catalog circuit', () => {
    const id = resolveCircuitIdFromLinks(
      [
        link({ linkId: 'a', linkIndex: 0, circuitId: 'gb-1948' }),
        link({ linkId: 'b', linkIndex: 1, circuitId: 'ae-2009' }),
      ],
      circuits,
    );
    expect(id).toBe('ae-2009');
  });

  it('skips unknown legacy circuit ids', () => {
    const id = resolveCircuitIdFromLinks(
      [link({ linkId: 'a', linkIndex: 0, circuitId: 'unknown' })],
      circuits,
    );
    expect(id).toBeUndefined();
  });
});
