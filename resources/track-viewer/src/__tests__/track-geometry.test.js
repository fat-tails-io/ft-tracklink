/**
 * Run: node --experimental-vm-modules resources/track-viewer/src/__tests__/track-geometry.test.js
 * Or from track-viewer after build tooling supports it.
 */
import assert from 'assert';
import * as d3 from 'd3';
import {
  buildTrackGeometryIndex,
  collectCenterlineHitIndices,
  extractCenterline,
  selectSegmentFromBrush,
} from '../track-geometry.js';

const geo = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { role: 'centerline', circuitId: 'test-1' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [0.01, 0],
          [0.02, 0],
        ],
      },
    },
  ],
};

const centerline = extractCenterline(geo);
assert.ok(centerline);
assert.equal(centerline.circuitId, 'test-1');

const index = buildTrackGeometryIndex(centerline.coordinates, 100);
assert.ok(index.totalLengthM > 0);
assert.ok(index.coordinates.length >= 3);

const projection = d3
  .geoMercator()
  .fitExtent(
    [[0, 0], [400, 400]],
    { type: 'FeatureCollection', features: geo.features },
  );

const p0 = projection(index.coordinates[0]);
const pN = projection(index.coordinates[Math.floor(index.coordinates.length / 2)]);
const transform = { k: 1, x: 0, y: 0 };
const minX = Math.min(p0[0], pN[0]) - 5;
const maxX = Math.max(p0[0], pN[0]) + 5;
const minY = Math.min(p0[1], pN[1]) - 5;
const maxY = Math.max(p0[1], pN[1]) + 5;

let segment = selectSegmentFromBrush(
  index,
  projection,
  { minX, minY, maxX, maxY },
  transform,
);
assert.ok(segment);
assert.ok(segment.endDistanceM >= segment.startDistanceM);
assert.ok(segment.segmentLengthM > 0);
assert.ok(segment.totalCircuitLengthM > 1000, 'circuit length should be kilometres-scale metres');

// Lenient: brush offset from line but within stroke tolerance
const mid = projection(index.coordinates[Math.floor(index.coordinates.length / 2)]);
const offsetRect = {
  minX: mid[0] + 25,
  minY: mid[1] - 15,
  maxX: mid[0] + 85,
  maxY: mid[1] + 45,
};
const nearHits = collectCenterlineHitIndices(index, projection, offsetRect, transform);
assert.ok(nearHits.length > 0, 'stroke tolerance should include nearby centerline');
segment = selectSegmentFromBrush(index, projection, offsetRect, transform);
assert.ok(segment, 'selectSegmentFromBrush should succeed near the line');

console.log('track-geometry tests passed');
