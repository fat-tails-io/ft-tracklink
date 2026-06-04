import type { SelectionSummary, TrackSelectionPayload } from '../types/track-selection';

const formatCoordPair = (pair?: [number, number] | null): string => {
  if (!pair) {
    return 'N/A';
  }
  return pair.map((coord) => coord?.toFixed(6)).join(', ');
};

export const formatSelectionDetails = (selection: TrackSelectionPayload): string => {
  const { viewport, screenCoords, geoCoords, geo, trackRelative, trackProperties } = selection;
  const trackPropsText = trackProperties ? JSON.stringify(trackProperties, null, 2) : 'None supplied';

  const start = geo?.start ?? geoCoords.start ?? geoCoords.topLeft;
  const end = geo?.end ?? geoCoords.end ?? geoCoords.bottomRight;

  const lines = [
    'Track section details:',
    `• Viewport -> x: ${viewport.x.toFixed(2)}, y: ${viewport.y.toFixed(2)}, width: ${viewport.width.toFixed(2)}, height: ${viewport.height.toFixed(2)}, scale: ${viewport.scale.toFixed(2)}`,
    `• Screen -> x: ${Math.round(screenCoords.x)}, y: ${Math.round(screenCoords.y)}, width: ${Math.round(screenCoords.width)}, height: ${Math.round(screenCoords.height)}`,
    `• Geo segment -> start: ${formatCoordPair(start)} | end: ${formatCoordPair(end)}`,
  ];

  if (trackRelative) {
    lines.push(
      `• Along track -> ${trackRelative.startDistanceM.toFixed(1)} m – ${trackRelative.endDistanceM.toFixed(1)} m (segment ${trackRelative.segmentLengthM.toFixed(1)} m, circuit ${trackRelative.totalCircuitLengthM.toFixed(1)} m)`,
    );
  } else {
    lines.push(
      `• Geo bbox -> top left: ${formatCoordPair(geoCoords.topLeft)} | bottom right: ${formatCoordPair(geoCoords.bottomRight)}`,
    );
  }

  lines.push(`• Track properties -> ${trackPropsText}`);

  return lines.join('\n');
};

export const buildSelectionSummary = (selection: TrackSelectionPayload): SelectionSummary => {
  const { viewport, screenCoords, geoCoords, geo, trackRelative } = selection;
  const start = geo?.start ?? geoCoords.start ?? geoCoords.topLeft;
  const end = geo?.end ?? geoCoords.end ?? geoCoords.bottomRight;

  return {
    viewport: `x: ${viewport.x.toFixed(2)}, y: ${viewport.y.toFixed(2)}, width: ${viewport.width.toFixed(2)}, height: ${viewport.height.toFixed(2)}, scale: ${viewport.scale.toFixed(2)}`,
    screen: `x: ${Math.round(screenCoords.x)}, y: ${Math.round(screenCoords.y)}, width: ${Math.round(screenCoords.width)}, height: ${Math.round(screenCoords.height)}`,
    geo: `Start: ${formatCoordPair(start)} | End: ${formatCoordPair(end)}`,
    trackRelative: trackRelative
      ? `${trackRelative.startDistanceM.toFixed(1)} m – ${trackRelative.endDistanceM.toFixed(1)} m (${trackRelative.segmentLengthM.toFixed(1)} m segment)`
      : 'Not available (legacy bbox selection)',
    trackProps: selection.trackProperties
      ? JSON.stringify(selection.trackProperties, null, 2)
      : 'None supplied',
  };
};
