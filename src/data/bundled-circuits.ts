import gb1948Raw from './tracks/gb-1948.json';
import ae2009Raw from './tracks/ae-2009.json';
import { normalizeCircuitGeoJson } from '../domain/circuit/circuit-geojson';
import type { CircuitSummary } from '../types';

export const CATALOG_VERSION = 1;

export const DEFAULT_CIRCUIT_ID = 'gb-1948';

export interface BundledCircuitSeed {
  id: string;
  summary: CircuitSummary;
  geoJson: ReturnType<typeof normalizeCircuitGeoJson>;
}

const gb1948Normalized = normalizeCircuitGeoJson(gb1948Raw, 'gb-1948');

const ae2009Normalized = normalizeCircuitGeoJson(ae2009Raw, 'ae-2009');

/** Bundled f1-circuits assets shipped with the Forge function bundle. */
export const BUNDLED_CIRCUITS: BundledCircuitSeed[] = [
  {
    id: 'gb-1948',
    summary: {
      id: 'gb-1948',
      name: 'Silverstone Circuit',
      location: 'Silverstone',
      lengthM: 5891,
      firstGp: 1950,
    },
    geoJson: gb1948Normalized,
  },
  {
    id: 'ae-2009',
    summary: {
      id: 'ae-2009',
      name: 'Yas Marina Circuit',
      location: 'Yas Marina',
      lengthM: 5281,
      firstGp: 2009,
    },
    geoJson: ae2009Normalized,
  },
];
