import type { CircuitSummary } from '../../types';
import { BUNDLED_CORNERS, type BundledCornerDef } from './bundled-corner-features';

type GeoJsonObject = {
  type: string;
  name?: string;
  features?: GeoJsonFeature[];
};

type GeoJsonFeature = {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: { type: string; coordinates?: unknown };
};

/**
 * Normalize bundled or uploaded GeoJSON for catalog storage:
 * - tag centerline LineString with role:centerline
 * - append corner Point features when defined for circuitId
 */
export function normalizeCircuitGeoJson(
  raw: GeoJsonObject,
  circuitId: string,
  mergeCorners = true,
): GeoJsonObject {
  if (raw.type === 'Feature') {
    return normalizeCircuitGeoJson(
      { type: 'FeatureCollection', features: [raw as GeoJsonFeature] },
      circuitId,
      mergeCorners,
    );
  }

  if (raw.type !== 'FeatureCollection' || !Array.isArray(raw.features)) {
    return raw;
  }

  const features = raw.features.map((feature) => {
    const props = { ...(feature.properties ?? {}) };
    const geomType = feature.geometry?.type;

    if (!props.role && geomType === 'LineString') {
      props.role = 'centerline';
      props.circuitId = circuitId;
    }

    return { ...feature, properties: props } as GeoJsonFeature;
  });

  if (mergeCorners) {
    const corners = BUNDLED_CORNERS[circuitId] ?? [];
    for (const corner of corners) {
      features.push(buildCornerFeature(corner, circuitId));
    }
  }

  return {
    ...raw,
    name: raw.name ?? circuitId,
    features,
  };
}

function buildCornerFeature(corner: BundledCornerDef, circuitId: string): GeoJsonFeature {
  return {
    type: 'Feature',
    properties: {
      role: 'corner',
      number: corner.number,
      name: corner.name,
      circuitId,
    },
    geometry: {
      type: 'Point',
      coordinates: corner.coordinates,
    },
  };
}

export function extractCircuitSummary(
  circuitId: string,
  geoJson: GeoJsonObject,
  fallbackName?: string,
): CircuitSummary {
  const centerline = findCenterlineFeature(geoJson);
  const props = centerline?.properties ?? {};

  const name =
    (typeof props.Name === 'string' && props.Name) ||
    (typeof props.name === 'string' && props.name) ||
    fallbackName ||
    circuitId;

  const location =
    (typeof props.Location === 'string' && props.Location) ||
    (typeof props.location === 'string' && props.location) ||
    name;

  const lengthM =
    typeof props.length === 'number'
      ? props.length
      : typeof props.lengthM === 'number'
        ? props.lengthM
        : undefined;

  const firstGp =
    typeof props.firstgp === 'number'
      ? props.firstgp
      : typeof props.firstGp === 'number'
        ? props.firstGp
        : undefined;

  return {
    id: circuitId,
    name,
    location,
    lengthM,
    firstGp,
  };
}

function findCenterlineFeature(geoJson: GeoJsonObject): GeoJsonFeature | undefined {
  if (geoJson.type === 'Feature') {
    return geoJson as GeoJsonFeature;
  }
  if (!geoJson.features?.length) {
    return undefined;
  }

  const withRole = geoJson.features.find((f) => f.properties?.role === 'centerline');
  if (withRole) {
    return withRole;
  }

  return (
    geoJson.features.find((f) => f.geometry?.type === 'LineString') ?? geoJson.features[0]
  );
}

export function parseGeoJsonContent(content: string | object): GeoJsonObject {
  if (typeof content === 'string') {
    return JSON.parse(content) as GeoJsonObject;
  }
  return content as GeoJsonObject;
}
