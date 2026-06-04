import { storage } from '@forge/api';
import { MAX_TRACK_LINKS_PER_ISSUE } from '../../domain/track-link/constants';
import type {
  IssueTrackLinks,
  TrackLinkEntry,
  TrackSection,
  TrackSvg,
  TrackGeoJson,
  Theme,
  SaveTrackSvgRequest,
  SaveTrackGeoJsonRequest,
  SaveThemeRequest,
} from '../../types';

import {
  extractCircuitSummary,
  normalizeCircuitGeoJson,
  parseGeoJsonContent,
} from '../../domain/circuit/circuit-geojson';
import {
  getCircuitGeoJson,
  migrateLegacyTrackGeoJson,
  resolveActiveCircuitId,
  saveCircuitGeoJson,
  upsertCircuit,
} from './circuit-catalog-storage';

const TRACK_SECTION_PREFIX = 'track-section-';
const TRACK_SVG_KEY = 'track-svg';
const THEME_KEY = 'app-theme';

function storageKey(issueKey: string): string {
  return `${TRACK_SECTION_PREFIX}${issueKey}`;
}

function isIssueTrackLinks(value: unknown): value is IssueTrackLinks {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as IssueTrackLinks).links)
  );
}

/** Migrate legacy single TrackSection to IssueTrackLinks. */
function normalizeStoredLinks(issueKey: string, raw: unknown): IssueTrackLinks | null {
  if (!raw) {
    return null;
  }

  if (isIssueTrackLinks(raw)) {
    return {
      issueKey: raw.issueKey || issueKey,
      links: raw.links.map((link, index) => ({
        ...link,
        linkIndex: link.linkIndex ?? index,
      })),
      updatedAt: raw.updatedAt ?? Date.now(),
    };
  }

  const legacy = raw as TrackSection;
  if (!legacy.viewport) {
    return null;
  }

  const linkId = `legacy-${legacy.createdAt ?? Date.now()}`;
  return {
    issueKey,
    links: [
      {
        linkId,
        linkIndex: 0,
        circuitId: legacy.circuitId ?? 'unknown',
        viewport: legacy.viewport,
        trackRelative: legacy.trackRelative,
        geo: legacy.geo,
        sampledPoints: legacy.sampledPoints,
        svgSectionId: legacy.svgSectionId,
        createdAt: legacy.createdAt ?? Date.now(),
      },
    ],
    updatedAt: legacy.createdAt ?? Date.now(),
  };
}

export async function getIssueTrackLinks(issueKey: string): Promise<IssueTrackLinks | null> {
  const raw: unknown = await storage.get(storageKey(issueKey));
  return normalizeStoredLinks(issueKey, raw);
}

export type AppendTrackLinkInput = Omit<TrackLinkEntry, 'linkId' | 'linkIndex' | 'createdAt'>;

export class TrackLinkLimitError extends Error {
  constructor(
    public readonly issueKey: string,
    public readonly maxLinks: number,
  ) {
    super(`Issue ${issueKey} already has the maximum of ${maxLinks} track links.`);
    this.name = 'TrackLinkLimitError';
  }
}

/**
 * Append a track segment link to an issue (max {@link MAX_TRACK_LINKS_PER_ISSUE}).
 */
export async function appendTrackLink(
  issueKey: string,
  entry: AppendTrackLinkInput,
): Promise<TrackLinkEntry> {
  const existing = (await getIssueTrackLinks(issueKey)) ?? {
    issueKey,
    links: [],
    updatedAt: Date.now(),
  };

  if (existing.links.length >= MAX_TRACK_LINKS_PER_ISSUE) {
    throw new TrackLinkLimitError(issueKey, MAX_TRACK_LINKS_PER_ISSUE);
  }

  const linkId = crypto.randomUUID();
  const linkIndex = existing.links.length;
  const newEntry: TrackLinkEntry = {
    ...entry,
    linkId,
    linkIndex,
    createdAt: Date.now(),
  };

  const updated: IssueTrackLinks = {
    issueKey,
    links: [...existing.links, newEntry],
    updatedAt: Date.now(),
  };

  await storage.set(storageKey(issueKey), updated as unknown as Record<string, unknown>);
  return newEntry;
}

export async function patchTrackLink(
  issueKey: string,
  linkId: string,
  patch: Partial<Pick<TrackLinkEntry, 'commentId' | 'thumbnailFilename'>>,
): Promise<TrackLinkEntry | null> {
  const bundle = await getIssueTrackLinks(issueKey);
  if (!bundle) {
    return null;
  }

  const index = bundle.links.findIndex((l) => l.linkId === linkId);
  if (index < 0) {
    return null;
  }

  const updatedLink: TrackLinkEntry = {
    ...bundle.links[index],
    ...patch,
  };
  const links = [...bundle.links];
  links[index] = updatedLink;

  await storage.set(storageKey(issueKey), {
    issueKey,
    links,
    updatedAt: Date.now(),
  } as unknown as Record<string, unknown>);

  return updatedLink;
}

/**
 * @deprecated Use appendTrackLink. Replaces entire record with a single legacy link.
 */
export async function storeTrackLink(issueKey: string, section: Omit<TrackSection, 'issueKey' | 'createdAt'>): Promise<void> {
  await appendTrackLink(issueKey, {
    circuitId: section.circuitId ?? 'unknown',
    viewport: section.viewport,
    trackRelative: section.trackRelative,
    geo: section.geo,
    sampledPoints: section.sampledPoints,
    svgSectionId: section.svgSectionId,
  });
}

/**
 * @deprecated Use getIssueTrackLinks
 */
export async function getTrackLink(issueKey: string): Promise<TrackSection | null> {
  const bundle = await getIssueTrackLinks(issueKey);
  if (!bundle?.links.length) {
    return null;
  }
  const first = bundle.links[0];
  return {
    issueKey,
    viewport: first.viewport,
    svgSectionId: first.svgSectionId,
    circuitId: first.circuitId,
    trackRelative: first.trackRelative,
    geo: first.geo,
    sampledPoints: first.sampledPoints,
    createdAt: first.createdAt,
  };
}

/**
 * Get all track links
 */
export function getAllTrackLinks(): Promise<TrackSection[]> {
  // Note: KVS doesn't support listing all keys directly
  // In a production app, you might maintain a separate index
  // For now, we'll need to track issue keys separately or use a different approach
  // This is a simplified version - you may need to enhance this based on usage patterns
  throw new Error('getAllTrackLinks not fully implemented - requires key tracking mechanism');
}

/**
 * Delete track link for a specific issue
 */
export async function deleteTrackLink(issueKey: string): Promise<void> {
  const key = `${TRACK_SECTION_PREFIX}${issueKey}`;
  await storage.delete(key);
}

/**
 * Save SVG file to storage
 */
export async function saveTrackSvg(request: SaveTrackSvgRequest): Promise<void> {
  const key = request.trackId ? `track-svg-${request.trackId}` : TRACK_SVG_KEY;
  const trackSvg: TrackSvg = {
    svgContent: request.svgContent,
    trackName: request.trackName,
    uploadedAt: Date.now(),
  };
  await storage.set(key, trackSvg as unknown as Record<string, unknown>);
}

/**
 * Get SVG file from storage
 */
export async function getTrackSvg(trackId?: string): Promise<TrackSvg | null> {
  const key = trackId ? `track-svg-${trackId}` : TRACK_SVG_KEY;
  return ((await storage.get(key)) as TrackSvg | null) || null;
}

/**
 * Save GeoJSON to catalog storage (`track-geojson-{circuitId}`).
 */
export async function saveTrackGeoJson(request: SaveTrackGeoJsonRequest): Promise<void> {
  const circuitId = request.circuitId ?? request.trackId;
  if (!circuitId) {
    throw new Error('circuitId (or trackId) is required — use the circuit catalog');
  }

  const parsed = parseGeoJsonContent(request.geoJsonContent);
  const normalized = normalizeCircuitGeoJson(parsed, circuitId, false);
  await saveCircuitGeoJson(circuitId, normalized, request.trackName);

  const summary = extractCircuitSummary(circuitId, normalized, request.trackName);
  await upsertCircuit({
    ...summary,
    location: request.location ?? summary.location,
    lengthM: request.lengthM ?? summary.lengthM,
    firstGp: request.firstGp ?? summary.firstGp,
  });
}

/**
 * Get GeoJSON for a circuit. When circuitId omitted, uses last-used / catalog default.
 */
export async function getTrackGeoJson(
  circuitId?: string,
  accountId?: string,
): Promise<TrackGeoJson | null> {
  await migrateLegacyTrackGeoJson();

  const resolvedId = circuitId ?? (await resolveActiveCircuitId(accountId));
  const stored = await getCircuitGeoJson(resolvedId);
  if (stored) {
    return stored;
  }

  return null;
}

/**
 * Save theme configuration
 */
export async function saveTheme(request: SaveThemeRequest): Promise<void> {
  const key = request.userId ? `${THEME_KEY}-${request.userId}` : THEME_KEY;
  await storage.set(key, request.theme as unknown as Record<string, unknown>);
}

/**
 * Get theme configuration
 */
export async function getTheme(userId?: string): Promise<Theme | null> {
  // Try user-specific theme first, then fall back to global theme
  if (userId) {
    const userTheme = (await storage.get(`${THEME_KEY}-${userId}`)) as Theme | null;
    if (userTheme) {
      return userTheme;
    }
  }
  return ((await storage.get(THEME_KEY)) as Theme | null) || null;
}

