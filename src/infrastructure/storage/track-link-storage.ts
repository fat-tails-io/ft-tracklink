import { storage } from '@forge/api';
import type {
  TrackSection,
  TrackSvg,
  TrackGeoJson,
  Theme,
  SaveTrackSvgRequest,
  SaveTrackGeoJsonRequest,
  SaveThemeRequest,
} from '../../types';

const TRACK_SECTION_PREFIX = 'track-section-';
const TRACK_SVG_KEY = 'track-svg';
const TRACK_GEOJSON_KEY = 'track-geojson';
const THEME_KEY = 'app-theme';

/**
 * Store link between track section and JIRA issue
 */
export async function storeTrackLink(issueKey: string, section: Omit<TrackSection, 'issueKey' | 'createdAt'>): Promise<void> {
  const key = `${TRACK_SECTION_PREFIX}${issueKey}`;
  const trackSection: TrackSection = {
    ...section,
    issueKey,
    createdAt: Date.now(),
  };
  await storage.set(key, trackSection as unknown as Record<string, unknown>);
}

/**
 * Get track link for a specific issue
 */
export async function getTrackLink(issueKey: string): Promise<TrackSection | null> {
  const key = `${TRACK_SECTION_PREFIX}${issueKey}`;
  return ((await storage.get(key)) as TrackSection | null) || null;
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
 * Save GeoJSON file to storage
 */
export async function saveTrackGeoJson(request: SaveTrackGeoJsonRequest): Promise<void> {
  const key = request.trackId ? `track-geojson-${request.trackId}` : TRACK_GEOJSON_KEY;
  const trackGeoJson: TrackGeoJson = {
    geoJsonContent: typeof request.geoJsonContent === 'string' 
      ? request.geoJsonContent 
      : JSON.stringify(request.geoJsonContent),
    trackName: request.trackName,
    uploadedAt: Date.now(),
  };
  await storage.set(key, trackGeoJson as unknown as Record<string, unknown>);
}

/**
 * Get GeoJSON file from storage
 */
export async function getTrackGeoJson(trackId?: string): Promise<TrackGeoJson | null> {
  const key = trackId ? `track-geojson-${trackId}` : TRACK_GEOJSON_KEY;
  return ((await storage.get(key)) as TrackGeoJson | null) || null;
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

