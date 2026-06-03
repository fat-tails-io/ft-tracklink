import type { TrackViewport } from '../../types';

export type TrackSelectionPayload = {
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
  };
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
  trackProps: string;
};
