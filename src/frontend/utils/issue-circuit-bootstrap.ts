import type { CircuitSummary } from '../../types';
import type { TrackLinkEntry } from '../../types';

/** Circuit ids that must not be used for auto-load (legacy / placeholder). */
const INVALID_CIRCUIT_IDS = new Set(['unknown', '']);

/**
 * Pick the most recent saved link whose circuit exists in the catalog.
 */
export const resolveCircuitIdFromLinks = (
  links: TrackLinkEntry[],
  circuits: CircuitSummary[],
): string | undefined => {
  const catalogIds = new Set(circuits.map((c) => c.id));

  for (let i = links.length - 1; i >= 0; i -= 1) {
    const id = links[i].circuitId;
    if (id && !INVALID_CIRCUIT_IDS.has(id) && catalogIds.has(id)) {
      return id;
    }
  }

  return undefined;
};
