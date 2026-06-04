import type { TrackViewport } from '../../types';

export type TrackRelativeSelection = {
  startDistanceM: number;
  endDistanceM: number;
  totalCircuitLengthM: number;
  segmentLengthM: number;
};

export type TrackSegmentGeo = {
  start: [number, number];
  end: [number, number];
  precision: number;
};

export type SampledTrackPoint = {
  distanceM: number;
  lon: number;
  lat: number;
};

export type TrackSelectionPayload = {
  circuitId?: string;
  viewport: TrackViewport;
  screenCoords: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  geoCoords: {
    topLeft?: [number, number] | null;
    bottomRight?: [number, number] | null;
    start?: [number, number];
    end?: [number, number];
  };
  geo?: TrackSegmentGeo;
  trackRelative?: TrackRelativeSelection;
  sampledPoints?: SampledTrackPoint[];
  trackProperties?: Record<string, unknown>;
  thumbnailData?: string;
};

export type IssueFormState = {
  projectKey: string;
  issueType: string;
  summary: string;
  description: string;
};

export type SelectionSummary = {
  viewport: string;
  screen: string;
  geo: string;
  trackRelative: string;
  trackProps: string;
};
