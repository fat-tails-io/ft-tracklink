import type { ViewerInteractionMode } from '../constants/viewer-events';

export const getStatusWhenNoTrack = (): string =>
  'Upload a track GeoJSON file to load the circuit map.';

export const getStatusForMode = (mode: ViewerInteractionMode, trackLoaded: boolean): string => {
  if (!trackLoaded) {
    return getStatusWhenNoTrack();
  }
  if (mode === 'brush') {
    return 'Brush Select — drag on the map to select an area.';
  }
  return 'Pan / Zoom — drag to pan, scroll to zoom.';
};

export const getStatusAfterSelection = (): string =>
  'Selection captured. Review the summary below or create a Jira issue.';
