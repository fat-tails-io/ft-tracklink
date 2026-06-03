export type ViewerInteractionMode = 'pan' | 'brush';

export const VIEWER_EVENT = {
  SET_MODE: 'VIEWER_SET_MODE',
  STATUS: 'VIEWER_STATUS',
} as const;

export interface ViewerSetModePayload {
  mode: ViewerInteractionMode;
}

export interface ViewerStatusPayload {
  message: string;
}
