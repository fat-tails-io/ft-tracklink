export type ViewerInteractionMode = 'pan' | 'brush';

export const VIEWER_EVENT = {
  SET_MODE: 'VIEWER_SET_MODE',
  STATUS: 'VIEWER_STATUS',
  HIGHLIGHT_SEGMENT: 'HIGHLIGHT_SEGMENT',
} as const;

export interface ViewerHighlightSegmentPayload {
  circuitId?: string;
  linkId?: string;
  trackRelative?: {
    startDistanceM: number;
    endDistanceM: number;
  };
}

export interface ViewerSetModePayload {
  mode: ViewerInteractionMode;
}

export interface ViewerStatusPayload {
  message: string;
}
