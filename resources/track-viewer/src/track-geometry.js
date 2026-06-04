/**
 * Geodesic centerline indexing for brush-to-track-segment selection (Phase 4).
 */

import * as d3 from 'd3';

/** Spherical earth radius (m); multiply d3.geoLength (radians) for metres. */
export const EARTH_RADIUS_M = 6371008.8;

export const DENSIFY_STEP_M = 1;
export const MAX_SAMPLED_POINTS = 50;
export const GEO_PRECISION = 6;
/** Extra pixels around the brush box so near-miss drags still count. */
export const BRUSH_RECT_PADDING_PX = 20;
/** Max screen distance from centerline to brush for a hit (stroke tolerance). */
export const BRUSH_STROKE_TOLERANCE_PX = 40;

/** d3.geoLength returns radians along the sphere; convert to metres for F1 track distances. */
export function geoLengthM(geo) {
  return d3.geoLength(geo) * EARTH_RADIUS_M;
}

function expandBrushRect(rect, paddingPx) {
  return {
    minX: rect.minX - paddingPx,
    minY: rect.minY - paddingPx,
    maxX: rect.maxX + paddingPx,
    maxY: rect.maxY + paddingPx,
  };
}

function pointInRect(x, y, rect) {
  return x >= rect.minX && x <= rect.maxX && y >= rect.minY && y <= rect.maxY;
}

/** Shortest distance from a point to an axis-aligned rectangle (0 if inside). */
function distancePointToRect(px, py, rect) {
  const dx = px < rect.minX ? rect.minX - px : px > rect.maxX ? px - rect.maxX : 0;
  const dy = py < rect.minY ? rect.minY - py : py > rect.maxY ? py - rect.maxY : 0;
  return Math.hypot(dx, dy);
}

function projectToScreen(coordinate, projection, transform) {
  const projected = projection(coordinate);
  if (!projected) {
    return null;
  }
  const k = transform.k ?? 1;
  const tx = transform.x ?? 0;
  const ty = transform.y ?? 0;
  return [projected[0] * k + tx, projected[1] * k + ty];
}

/** True if any part of the screen segment lies within tolerance of the brush rect. */
function segmentNearBrushRect(x0, y0, x1, y1, rect, tolerancePx) {
  if (pointInRect(x0, y0, rect) || pointInRect(x1, y1, rect)) {
    return true;
  }

  if (distancePointToRect(x0, y0, rect) <= tolerancePx
    || distancePointToRect(x1, y1, rect) <= tolerancePx) {
    return true;
  }

  const samples = 8;
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const sx = x0 + t * (x1 - x0);
    const sy = y0 + t * (y1 - y0);
    if (pointInRect(sx, sy, rect) || distancePointToRect(sx, sy, rect) <= tolerancePx) {
      return true;
    }
  }

  return false;
}

/**
 * Collect densified centerline indices that intersect or pass near the brush.
 * @returns {number[]}
 */
export function collectCenterlineHitIndices(
  index,
  projection,
  brushRect,
  transform,
  options = {},
) {
  if (!index || !projection) {
    return [];
  }

  const paddingPx = options.paddingPx ?? BRUSH_RECT_PADDING_PX;
  const strokeTolerancePx = options.strokeTolerancePx ?? BRUSH_STROKE_TOLERANCE_PX;
  const expandedRect = expandBrushRect(brushRect, paddingPx);
  const hitSet = new Set();
  const { coordinates } = index;

  const considerPoint = (i, sx, sy) => {
    if (pointInRect(sx, sy, expandedRect)
      || distancePointToRect(sx, sy, expandedRect) <= strokeTolerancePx) {
      hitSet.add(i);
    }
  };

  for (let i = 0; i < coordinates.length; i += 1) {
    const screen = projectToScreen(coordinates[i], projection, transform);
    if (!screen) {
      continue;
    }
    considerPoint(i, screen[0], screen[1]);

    if (i === 0) {
      continue;
    }

    const prev = projectToScreen(coordinates[i - 1], projection, transform);
    if (!prev) {
      continue;
    }

    if (segmentNearBrushRect(prev[0], prev[1], screen[0], screen[1], expandedRect, strokeTolerancePx)) {
      hitSet.add(i - 1);
      hitSet.add(i);
    }
  }

  return [...hitSet].sort((a, b) => a - b);
}

/** Longest run of consecutive indices (avoids spanning the lap when hits are disjoint). */
function largestContiguousRun(sortedIndices) {
  if (!sortedIndices.length) {
    return [];
  }

  let best = [];
  let current = [sortedIndices[0]];

  for (let i = 1; i < sortedIndices.length; i += 1) {
    if (sortedIndices[i] <= current[current.length - 1] + 1) {
      current.push(sortedIndices[i]);
    } else {
      if (current.length > best.length) {
        best = current;
      }
      current = [sortedIndices[i]];
    }
  }

  return current.length > best.length ? current : best;
}

/**
 * @param {import('geojson').FeatureCollection | import('geojson').Feature} geoData
 * @returns {{ coordinates: [number, number][], circuitId?: string, properties?: object } | null}
 */
export function extractCenterline(geoData) {
  if (!geoData) {
    return null;
  }

  let feature = null;
  if (geoData.type === 'FeatureCollection' && Array.isArray(geoData.features)) {
    feature =
      geoData.features.find((f) => f.properties?.role === 'centerline') ||
      geoData.features.find((f) => f.geometry?.type === 'LineString');
  } else if (geoData.type === 'Feature') {
    feature = geoData;
  }

  if (!feature?.geometry || feature.geometry.type !== 'LineString') {
    return null;
  }

  const coordinates = feature.geometry.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const props = feature.properties || {};
  const circuitId =
    (typeof props.circuitId === 'string' && props.circuitId) ||
    (typeof props.id === 'string' && props.id) ||
    (typeof geoData.name === 'string' && geoData.name) ||
    undefined;

  return {
    coordinates,
    circuitId,
    properties: props,
  };
}

/**
 * @param {[number, number][]} coords [lon, lat]
 * @param {number} [stepM]
 */
export function buildTrackGeometryIndex(coords, stepM = DENSIFY_STEP_M) {
  const dense = [];
  const cumulativeM = [];
  let totalLengthM = 0;

  dense.push(coords[0]);
  cumulativeM.push(0);

  for (let i = 1; i < coords.length; i += 1) {
    const a = coords[i - 1];
    const b = coords[i];
    const segment = { type: 'LineString', coordinates: [a, b] };
    const segLenM = geoLengthM(segment);
    if (segLenM <= 0) {
      continue;
    }

    const steps = Math.max(1, Math.ceil(segLenM / stepM));
    for (let j = 1; j <= steps; j += 1) {
      const t = j / steps;
      const point = d3.geoInterpolate(a, b)(t);
      const leg = geoLengthM({
        type: 'LineString',
        coordinates: [dense[dense.length - 1], point],
      });
      totalLengthM += leg;
      dense.push(point);
      cumulativeM.push(totalLengthM);
    }
  }

  return {
    coordinates: dense,
    cumulativeM,
    totalLengthM,
  };
}

/**
 * @param {ReturnType<typeof buildTrackGeometryIndex>} index
 * @param {import('d3').GeoProjection} projection
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} brushRect screen pixels (with zoom baked in)
 * @param {{ k: number, x: number, y: number }} transform d3 zoom transform on container
 */
export function selectSegmentFromBrush(index, projection, brushRect, transform, options = {}) {
  if (!index || !projection) {
    return null;
  }

  const { coordinates, cumulativeM, totalLengthM } = index;
  const hitIndices = collectCenterlineHitIndices(
    index,
    projection,
    brushRect,
    transform,
    options,
  );

  if (hitIndices.length === 0) {
    return null;
  }

  const run = largestContiguousRun(hitIndices);
  if (!run.length) {
    return null;
  }

  const i0 = run[0];
  const i1 = run[run.length - 1];
  const start = coordinates[i0];
  const end = coordinates[i1];
  const startDistanceM = cumulativeM[i0];
  const endDistanceM = cumulativeM[i1];
  const segmentLengthM = Math.max(0, endDistanceM - startDistanceM);

  return {
    start,
    end,
    startDistanceM,
    endDistanceM,
    totalCircuitLengthM: totalLengthM,
    segmentLengthM,
    indexStart: i0,
    indexEnd: i1,
    coordinates,
    cumulativeM,
  };
}

/**
 * @param {ReturnType<typeof selectSegmentFromBrush>} segment
 * @param {number} [maxPoints]
 */
export function sampleSegmentPoints(segment, maxPoints = MAX_SAMPLED_POINTS) {
  if (!segment) {
    return [];
  }

  const { coordinates, cumulativeM, indexStart, indexEnd } = segment;
  const span = indexEnd - indexStart;
  if (span <= 0) {
    const [lon, lat] = coordinates[indexStart];
    return [{ distanceM: cumulativeM[indexStart], lon, lat }];
  }

  const count = Math.min(maxPoints, span + 1);
  const samples = [];
  for (let i = 0; i < count; i += 1) {
    const idx = indexStart + Math.round((i / (count - 1)) * span);
    const [lon, lat] = coordinates[idx];
    samples.push({
      distanceM: Math.round(cumulativeM[idx] * 10) / 10,
      lon: roundCoord(lon),
      lat: roundCoord(lat),
    });
  }
  return samples;
}

/**
 * @param {ReturnType<typeof selectSegmentFromBrush>} segment
 * @param {import('d3').GeoProjection} projection
 * @param {{ k: number, x: number, y: number }} transform
 */
export function segmentScreenBounds(segment, projection, transform) {
  const k = transform.k ?? 1;
  const tx = transform.x ?? 0;
  const ty = transform.y ?? 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = segment.indexStart; i <= segment.indexEnd; i += 1) {
    const projected = projection(segment.coordinates[i]);
    if (!projected) {
      continue;
    }
    const sx = projected[0] * k + tx;
    const sy = projected[1] * k + ty;
    minX = Math.min(minX, sx);
    minY = Math.min(minY, sy);
    maxX = Math.max(maxX, sx);
    maxY = Math.max(maxY, sy);
  }

  if (!Number.isFinite(minX)) {
    return null;
  }

  const padding = 8;
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
    scale: k,
  };
}

function roundCoord(value) {
  const factor = 10 ** GEO_PRECISION;
  return Math.round(value * factor) / factor;
}

export function roundLonLat(pair) {
  return [roundCoord(pair[0]), roundCoord(pair[1])];
}
