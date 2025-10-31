// Shared types for frontend-backend communication

export interface TrackViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface TrackSection {
  viewport: TrackViewport;
  svgSectionId?: string;
  issueKey: string;
  createdAt: number;
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
  trackId?: string; // optional, defaults to 'default'
}

export interface GetTrackGeoJsonResponse {
  geoJsonContent: string | object;
  trackName: string;
  uploadedAt: number;
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
  svgSectionId?: string;
}

export interface CreateTrackIssueResponse {
  issueKey: string;
  success: boolean;
}

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

