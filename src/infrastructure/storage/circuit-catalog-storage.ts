import { storage } from '@forge/api';
import {
  BUNDLED_CIRCUITS,
  CATALOG_VERSION,
  DEFAULT_CIRCUIT_ID,
} from '../../data/bundled-circuits';
import {
  extractCircuitSummary,
  normalizeCircuitGeoJson,
  parseGeoJsonContent,
} from '../../domain/circuit/circuit-geojson';
import type {
  CircuitCatalog,
  CircuitSummary,
  TrackGeoJson,
  UserTrackPreferences,
} from '../../types';

export const CIRCUIT_CATALOG_KEY = 'circuit-catalog';
export const CIRCUIT_GEOJSON_PREFIX = 'track-geojson-';
export const LEGACY_GEOJSON_KEY = 'track-geojson';
export const USER_PREFERENCES_PREFIX = 'user-preferences-';
export const APP_DEFAULT_CIRCUIT_KEY = 'app-default-circuit';

function circuitGeoJsonKey(circuitId: string): string {
  return `${CIRCUIT_GEOJSON_PREFIX}${circuitId}`;
}

export async function getCircuitCatalog(): Promise<CircuitCatalog | null> {
  return (await storage.get(CIRCUIT_CATALOG_KEY)) as CircuitCatalog | null;
}

export async function saveCircuitCatalog(catalog: CircuitCatalog): Promise<void> {
  await storage.set(CIRCUIT_CATALOG_KEY, catalog as unknown as Record<string, unknown>);
}

export async function listCircuitSummaries(): Promise<CircuitSummary[]> {
  const catalog = await getCircuitCatalog();
  return catalog?.circuits ?? [];
}

export async function upsertCircuit(summary: CircuitSummary): Promise<CircuitCatalog> {
  const existing = (await getCircuitCatalog()) ?? {
    version: CATALOG_VERSION,
    circuits: [],
    defaultCircuitId: DEFAULT_CIRCUIT_ID,
  };

  const circuits = existing.circuits.filter((c) => c.id !== summary.id);
  circuits.push(summary);
  circuits.sort((a, b) => a.name.localeCompare(b.name));

  const catalog: CircuitCatalog = {
    ...existing,
    version: CATALOG_VERSION,
    circuits,
    defaultCircuitId: existing.defaultCircuitId ?? DEFAULT_CIRCUIT_ID,
  };

  await saveCircuitCatalog(catalog);
  return catalog;
}

export async function deleteCircuit(circuitId: string): Promise<CircuitCatalog> {
  const existing = await getCircuitCatalog();
  if (!existing) {
    return { version: CATALOG_VERSION, circuits: [], defaultCircuitId: DEFAULT_CIRCUIT_ID };
  }

  const circuits = existing.circuits.filter((c) => c.id !== circuitId);
  const catalog: CircuitCatalog = {
    version: CATALOG_VERSION,
    circuits,
    defaultCircuitId:
      existing.defaultCircuitId === circuitId
        ? circuits[0]?.id ?? DEFAULT_CIRCUIT_ID
        : existing.defaultCircuitId ?? DEFAULT_CIRCUIT_ID,
  };

  await saveCircuitCatalog(catalog);
  await storage.delete(circuitGeoJsonKey(circuitId));
  return catalog;
}

export async function saveCircuitGeoJson(
  circuitId: string,
  geoJsonContent: string | object,
  trackName: string,
): Promise<void> {
  const parsed = parseGeoJsonContent(geoJsonContent);
  const normalized = normalizeCircuitGeoJson(parsed, circuitId, false);
  const trackGeoJson: TrackGeoJson = {
    geoJsonContent: JSON.stringify(normalized),
    trackName,
    uploadedAt: Date.now(),
  };
  await storage.set(circuitGeoJsonKey(circuitId), trackGeoJson as unknown as Record<string, unknown>);
}

export async function getCircuitGeoJson(circuitId: string): Promise<TrackGeoJson | null> {
  return ((await storage.get(circuitGeoJsonKey(circuitId))) as TrackGeoJson | null) || null;
}

export async function getUserPreferences(accountId?: string): Promise<UserTrackPreferences | null> {
  if (!accountId) {
    return null;
  }
  return (await storage.get(`${USER_PREFERENCES_PREFIX}${accountId}`)) as UserTrackPreferences | null;
}

export async function setLastCircuit(circuitId: string, accountId?: string): Promise<void> {
  if (accountId) {
    const prefs: UserTrackPreferences = {
      lastCircuitId: circuitId,
      updatedAt: Date.now(),
    };
    await storage.set(
      `${USER_PREFERENCES_PREFIX}${accountId}`,
      prefs as unknown as Record<string, unknown>,
    );
  }
  await storage.set(APP_DEFAULT_CIRCUIT_KEY, circuitId);
}

export async function resolveActiveCircuitId(accountId?: string): Promise<string> {
  if (accountId) {
    const prefs = await getUserPreferences(accountId);
    if (prefs?.lastCircuitId) {
      return prefs.lastCircuitId;
    }
  }

  const appDefault = (await storage.get(APP_DEFAULT_CIRCUIT_KEY)) as string | null;
  if (appDefault) {
    return appDefault;
  }

  const catalog = await getCircuitCatalog();
  return catalog?.defaultCircuitId ?? DEFAULT_CIRCUIT_ID;
}

/**
 * Copy legacy single-key GeoJSON into catalog when present.
 */
export async function migrateLegacyTrackGeoJson(): Promise<string | null> {
  const legacy = (await storage.get(LEGACY_GEOJSON_KEY)) as TrackGeoJson | null;
  if (!legacy?.geoJsonContent) {
    return null;
  }

  const parsed = parseGeoJsonContent(legacy.geoJsonContent);
  const props = parsed.features?.[0]?.properties;
  const circuitId =
    (typeof props?.id === 'string' && props.id) ||
    (typeof parsed.name === 'string' && parsed.name) ||
    DEFAULT_CIRCUIT_ID;

  const normalized = normalizeCircuitGeoJson(parsed, circuitId);
  const summary = extractCircuitSummary(circuitId, normalized, legacy.trackName);

  await saveCircuitGeoJson(circuitId, normalized, legacy.trackName);
  await upsertCircuit(summary);
  await storage.delete(LEGACY_GEOJSON_KEY);

  return circuitId;
}

export async function seedCircuitLibrary(options?: {
  forceGeo?: boolean;
}): Promise<{ seeded: string[]; skipped: string[]; catalog: CircuitCatalog }> {
  await migrateLegacyTrackGeoJson();

  const seeded: string[] = [];
  const skipped: string[] = [];
  let catalog = (await getCircuitCatalog()) ?? {
    version: CATALOG_VERSION,
    circuits: [],
    defaultCircuitId: DEFAULT_CIRCUIT_ID,
  };

  for (const bundled of BUNDLED_CIRCUITS) {
    const existing = await getCircuitGeoJson(bundled.id);
    if (existing && !options?.forceGeo) {
      skipped.push(bundled.id);
      catalog = await upsertCircuit(bundled.summary);
      continue;
    }

    await saveCircuitGeoJson(bundled.id, bundled.geoJson, bundled.summary.name);
    catalog = await upsertCircuit(bundled.summary);
    seeded.push(bundled.id);
  }

  if (!catalog.defaultCircuitId) {
    catalog = {
      ...catalog,
      defaultCircuitId: DEFAULT_CIRCUIT_ID,
    };
    await saveCircuitCatalog(catalog);
  }

  return { seeded, skipped, catalog };
}

export async function ensureCircuitCatalog(): Promise<CircuitCatalog> {
  let catalog = await getCircuitCatalog();
  if (!catalog?.circuits?.length) {
    const result = await seedCircuitLibrary();
    return result.catalog;
  }
  if (catalog.version !== CATALOG_VERSION) {
    catalog = { ...catalog, version: CATALOG_VERSION };
    await saveCircuitCatalog(catalog);
  }
  return catalog;
}
