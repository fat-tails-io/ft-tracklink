import React from 'react';
import { Frame } from '@forge/react';
import { MAP_VIEWER_HEIGHT } from '../constants/map-viewer';

/**
 * Frame with explicit size so the iframe fills the map chrome (avoids grey gap below).
 * @see https://developer.atlassian.com/platform/forge/ui-kit/components/frame/
 */
export const TrackViewerFrame = (): React.JSX.Element => (
  // @ts-expect-error UI Kit Frame supports height/width; @forge/react typings omit them
  <Frame resource="track-viewer" height={MAP_VIEWER_HEIGHT} width="100%" />
);
