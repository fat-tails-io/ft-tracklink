import {
  extractCircuitSummary,
  normalizeCircuitGeoJson,
} from '../circuit-geojson';

describe('circuit-geojson', () => {
  const centerlineOnly = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: 'gb-1948',
          Name: 'Silverstone Circuit',
          Location: 'Silverstone',
          length: 5891,
          firstgp: 1950,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-1, 52],
            [-1.01, 52.01],
          ],
        },
      },
    ],
  };

  it('tags centerline and merges corner features for bundled circuits', () => {
    const normalized = normalizeCircuitGeoJson(centerlineOnly, 'gb-1948');
    const centerline = normalized.features?.find((f) => f.properties?.role === 'centerline');
    const corners = normalized.features?.filter((f) => f.properties?.role === 'corner') ?? [];

    expect(centerline).toBeDefined();
    expect(corners.length).toBeGreaterThan(0);
    expect(corners[0].properties?.number).toBe(1);
  });

  it('does not merge mock corners when GeoJSON already has corner features', () => {
    const withCorners = {
      type: 'FeatureCollection',
      features: [
        ...centerlineOnly.features,
        {
          type: 'Feature',
          properties: { role: 'corner', number: 99, name: 'Turn 99', circuitId: 'gb-1948' },
          geometry: { type: 'Point', coordinates: [-1, 52] },
        },
      ],
    };
    const normalized = normalizeCircuitGeoJson(withCorners, 'gb-1948');
    const corners = normalized.features?.filter((f) => f.properties?.role === 'corner') ?? [];
    expect(corners).toHaveLength(1);
    expect(corners[0].properties?.number).toBe(99);
  });

  it('extractCircuitSummary reads f1-circuits property names', () => {
    const summary = extractCircuitSummary('gb-1948', centerlineOnly);
    expect(summary).toEqual({
      id: 'gb-1948',
      name: 'Silverstone Circuit',
      location: 'Silverstone',
      lengthM: 5891,
      firstGp: 1950,
    });
  });
});
