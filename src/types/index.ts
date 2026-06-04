// Shared types for frontend-backend communication

export interface CircuitSummary {
  id: string;
  name: string;
  location: string;
  lengthM?: number;
  firstGp?: number;
}

export interface CircuitCatalog {
  version: number;
  circuits: CircuitSummary[];
  defaultCircuitId?: string;
}

export interface UserTrackPreferences {
  lastCircuitId?: string;
  updatedAt: number;
}

export interface ListCircuitsResponse {
  catalog: CircuitCatalog;
  lastCircuitId?: string;
}

export interface GetCircuitGeoJsonRequest {
  circuitId: string;
}

export interface SeedCircuitLibraryResponse {
  seeded: string[];
  skipped: string[];
  catalog: CircuitCatalog;
}

export interface SetLastCircuitRequest {
  circuitId: string;
  accountId?: string;
}

export interface TrackViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

/** @deprecated Legacy single-link shape; migrated to IssueTrackLinks on read. */
export interface TrackSection {
  viewport: TrackViewport;
  svgSectionId?: string;
  circuitId?: string;
  trackRelative?: TrackRelativeSegment;
  geo?: TrackSegmentEndpoints;
  sampledPoints?: TrackSamplePoint[];
  issueKey: string;
  createdAt: number;
}

export interface TrackRelativeSegment {
  startDistanceM: number;
  endDistanceM: number;
  segmentLengthM: number;
  totalCircuitLengthM?: number;
}

export interface TrackSegmentEndpoints {
  start: [number, number];
  end: [number, number];
  precision?: number;
}

export interface TrackSamplePoint {
  distanceM: number;
  lon: number;
  lat: number;
}

export interface TrackLinkEntry {
  linkId: string;
  linkIndex: number;
  circuitId: string;
  viewport: TrackViewport;
  trackRelative?: TrackRelativeSegment;
  geo?: TrackSegmentEndpoints;
  sampledPoints?: TrackSamplePoint[];
  thumbnailFilename?: string;
  commentId?: string;
  createdAt: number;
  /** @deprecated Legacy field on migrated entries */
  svgSectionId?: string;
}

export interface IssueTrackLinks {
  issueKey: string;
  links: TrackLinkEntry[];
  updatedAt: number;
}

export interface LinkSelectionToIssueRequest {
  issueKey: string;
  circuitId: string;
  circuitDisplayName?: string;
  viewport: TrackViewport;
  trackRelative?: TrackRelativeSegment;
  geo?: TrackSegmentEndpoints;
  sampledPoints?: TrackSamplePoint[];
  thumbnailData?: string;
}

export interface LinkSelectionToIssueResponse {
  linkId: string;
  linkIndex: number;
  commentId?: string;
  linkCount: number;
  maxLinks: number;
}

export interface CreateLinkedTrackIssueRequest {
  parentIssueKey: string;
  projectKey: string;
  summary: string;
  description?: string;
  circuitId: string;
  circuitDisplayName?: string;
  viewport: TrackViewport;
  trackRelative?: TrackRelativeSegment;
  geo?: TrackSegmentEndpoints;
  sampledPoints?: TrackSamplePoint[];
  thumbnailData?: string;
}

export interface CreateLinkedTrackIssueResponse {
  issueKey: string;
  linkId: string;
  success: boolean;
}

export interface GetIssueTrackContextResponse {
  issueKey: string;
  summary: string;
  links: TrackLinkEntry[];
  linkCount: number;
  maxLinks: number;
  canAddLink: boolean;
}

export interface TrackSvg {
  svgContent: string;
  trackName: string;
  uploadedAt: number;
}

export interface TrackGeoJson {
  geoJsonContent: string | object; // GeoJSON as string or parsed object
  trackName: string;
  uploadedAt: number;
}

export interface SaveTrackGeoJsonRequest {
  geoJsonContent: string | object;
  trackName: string;
  /** Circuit catalog id (e.g. gb-1948). Required for catalog uploads. */
  trackId?: string;
  circuitId?: string;
  location?: string;
  lengthM?: number;
  firstGp?: number;
}

export interface GetTrackGeoJsonResponse {
  geoJsonContent: string | object;
  trackName: string;
  uploadedAt: number;
  circuitId?: string;
}

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  teamName?: string;
  customStyles?: Record<string, string>;
}

export interface CreateTrackIssueRequest {
  summary: string;
  description?: string;
  projectKey: string;
  issueType: string;
  viewport: TrackViewport;
  thumbnailData: string; // base64 encoded image
  circuitId?: string;
  trackRelative?: TrackRelativeSegment;
  geo?: TrackSegmentEndpoints;
  sampledPoints?: TrackSamplePoint[];
  svgSectionId?: string;
}

export interface CreateTrackIssueResponse {
  issueKey: string;
  success: boolean;
}

/** @deprecated Use IssueTrackLinks / getIssueTrackLinks */
export interface TrackLink {
  viewport: TrackViewport;
  svgSectionId?: string;
  issueKey: string;
  createdAt: number;
}

export interface ThumbnailAttachmentRequest {
  issueKey: string;
  thumbnailData: string; // base64 encoded image
  filename?: string;
}

export interface SaveTrackSvgRequest {
  svgContent: string;
  trackName: string;
  trackId?: string; // optional, defaults to 'default'
}

export interface GetTrackSvgResponse {
  svgContent: string;
  trackName: string;
  uploadedAt: number;
}

export interface SaveThemeRequest {
  theme: Theme;
  userId?: string; // optional, if not provided, saves as global theme
}

