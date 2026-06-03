import type { SelectionSummary, TrackSelectionPayload } from '../types/track-selection';

export const formatSelectionDetails = (selection: TrackSelectionPayload): string => {
  const { viewport, screenCoords, geoCoords, trackProperties } = selection;
  const trackPropsText = trackProperties ? JSON.stringify(trackProperties, null, 2) : 'None supplied';
  const geoTopLeft = geoCoords.topLeft ? geoCoords.topLeft.map((coord) => coord?.toFixed(4)).join(', ') : 'N/A';
  const geoBottomRight = geoCoords.bottomRight
    ? geoCoords.bottomRight.map((coord) => coord?.toFixed(4)).join(', ')
    : 'N/A';

  return [
    'Track section details:',
    `• Viewport -> x: ${viewport.x.toFixed(2)}, y: ${viewport.y.toFixed(2)}, width: ${viewport.width.toFixed(2)}, height: ${viewport.height.toFixed(2)}, scale: ${viewport.scale.toFixed(2)}`,
    `• Screen -> x: ${Math.round(screenCoords.x)}, y: ${Math.round(screenCoords.y)}, width: ${Math.round(screenCoords.width)}, height: ${Math.round(screenCoords.height)}`,
    `• Geo -> top left: ${geoTopLeft} | bottom right: ${geoBottomRight}`,
    `• Track properties -> ${trackPropsText}`,
  ].join('\n');
};

export const buildSelectionSummary = (selection: TrackSelectionPayload): SelectionSummary => {
  const { viewport, screenCoords, geoCoords } = selection;
  return {
    viewport: `x: ${viewport.x.toFixed(2)}, y: ${viewport.y.toFixed(2)}, width: ${viewport.width.toFixed(2)}, height: ${viewport.height.toFixed(2)}, scale: ${viewport.scale.toFixed(2)}`,
    screen: `x: ${Math.round(screenCoords.x)}, y: ${Math.round(screenCoords.y)}, width: ${Math.round(screenCoords.width)}, height: ${Math.round(screenCoords.height)}`,
    geo: `Top left: ${geoCoords.topLeft ? geoCoords.topLeft.map((coord) => coord?.toFixed(4)).join(', ') : 'N/A'} | Bottom right: ${geoCoords.bottomRight ? geoCoords.bottomRight.map((coord) => coord?.toFixed(4)).join(', ') : 'N/A'}`,
    trackProps: selection.trackProperties
      ? JSON.stringify(selection.trackProperties, null, 2)
      : 'None supplied',
  };
};
