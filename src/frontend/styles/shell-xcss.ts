import { xcss } from '@forge/react';
import { MAP_VIEWER_HEIGHT } from '../constants/map-viewer';

export const panelSurfaceXcss = xcss({
  padding: 'space.200',
  backgroundColor: 'elevation.surface',
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'radius.medium',
});

export const frameSurfaceXcss = xcss({
  width: '100%',
  height: MAP_VIEWER_HEIGHT,
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'radius.medium',
  overflow: 'hidden',
});

export const subtleTextXcss = xcss({
  color: 'color.text.subtle',
});

export const trackMetaXcss = xcss({
  color: 'color.text.subtlest',
});
