import React from 'react';
import { Button, ButtonGroup } from '@forge/react';
import type { ViewerInteractionMode } from '../constants/viewer-events';

export interface ViewerMapControlsProps {
  mode: ViewerInteractionMode;
  trackLoaded: boolean;
  onModeChange: (mode: ViewerInteractionMode) => void;
}

export const ViewerMapControls = ({
  mode,
  trackLoaded,
  onModeChange,
}: ViewerMapControlsProps): React.JSX.Element => (
  <ButtonGroup>
    <Button
      appearance={mode === 'pan' ? 'primary' : 'subtle'}
      onClick={() => onModeChange('pan')}
      isDisabled={!trackLoaded}
    >
      Pan / Zoom
    </Button>
    <Button
      appearance={mode === 'brush' ? 'primary' : 'subtle'}
      onClick={() => onModeChange('brush')}
      isDisabled={!trackLoaded}
    >
      Brush Select
    </Button>
  </ButtonGroup>
);
