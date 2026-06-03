import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { events, invoke, showFlag } from '@forge/bridge';
import type { GetTrackGeoJsonResponse } from '../../types';
import type { TrackSelectionPayload } from '../types/track-selection';
import { buildSelectionSummary } from '../utils/selection-format';
import {
  VIEWER_EVENT,
  type ViewerInteractionMode,
  type ViewerSetModePayload,
  type ViewerStatusPayload,
} from '../constants/viewer-events';
import {
  getStatusAfterSelection,
  getStatusForMode,
  getStatusWhenNoTrack,
} from '../utils/viewer-status';

export type UseTrackLinkerCoreResult = {
  loading: boolean;
  trackLoaded: boolean;
  trackName: string;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  selectedSection: TrackSelectionPayload | null;
  setSelectedSection: (section: TrackSelectionPayload | null) => void;
  selectionSummary: ReturnType<typeof buildSelectionSummary> | null;
  viewerMode: ViewerInteractionMode;
  viewerStatus: string;
  setViewerMode: (mode: ViewerInteractionMode) => void;
  loadTrack: () => Promise<void>;
  handleReset: () => void;
};

const parseGeoJsonContent = (raw: string | object): unknown => {
  if (typeof raw === 'string') {
    return JSON.parse(raw) as unknown;
  }
  return raw;
};

export const useTrackLinkerCore = (): UseTrackLinkerCoreResult => {
  const [loading, setLoading] = useState<boolean>(true);
  const [trackLoaded, setTrackLoaded] = useState<boolean>(false);
  const [trackName, setTrackName] = useState<string>('');
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [frameReady, setFrameReady] = useState<boolean>(false);
  const [pendingGeoJson, setPendingGeoJson] = useState<unknown>(null);
  const [selectedSection, setSelectedSection] = useState<TrackSelectionPayload | null>(null);
  const [viewerMode, setViewerModeState] = useState<ViewerInteractionMode>('pan');
  const [viewerStatus, setViewerStatus] = useState<string>(getStatusWhenNoTrack());
  const viewerModeRef = useRef<ViewerInteractionMode>(viewerMode);
  viewerModeRef.current = viewerMode;

  const syncViewerMode = useCallback((mode: ViewerInteractionMode): void => {
    const payload: ViewerSetModePayload = { mode };
    void events.emit(VIEWER_EVENT.SET_MODE, payload);
  }, []);

  const setViewerMode = useCallback(
    (mode: ViewerInteractionMode): void => {
      setViewerModeState(mode);
      setViewerStatus(getStatusForMode(mode, trackLoaded));
      syncViewerMode(mode);
    },
    [trackLoaded, syncViewerMode],
  );

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void events
      .on('FRAME_READY', () => {
        setFrameReady(true);
        if (pendingGeoJson) {
          void events.emit('GEOJSON_LOAD', { geoJsonContent: pendingGeoJson });
          setPendingGeoJson(null);
        }
        syncViewerMode(viewerModeRef.current);
      })
      .then((subscription) => {
        if (active) {
          unsubscribe = subscription.unsubscribe;
        } else {
          subscription.unsubscribe();
        }
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [pendingGeoJson, syncViewerMode]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void events
      .on(VIEWER_EVENT.STATUS, (eventData) => {
        const payload = eventData as ViewerStatusPayload;
        if (payload?.message) {
          setViewerStatus(payload.message);
        }
      })
      .then((subscription) => {
        if (active) {
          unsubscribe = subscription.unsubscribe;
        } else {
          subscription.unsubscribe();
        }
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void events
      .on('TRACK_SECTION_SELECTED', (eventData) => {
        const payload = eventData as TrackSelectionPayload;
        setSelectedSection(payload);
        setViewerStatus(getStatusAfterSelection());
        showFlag({
          id: 'track-section-captured',
          title: 'Track section captured',
          type: 'info',
          appearance: 'info',
          description: 'Review the selection details below.',
          isAutoDismiss: true,
        });
      })
      .then((subscription) => {
        if (active) {
          unsubscribe = subscription.unsubscribe;
        } else {
          subscription.unsubscribe();
        }
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const loadTrack = useCallback(async (): Promise<void> => {
    try {
      const trackData = await invoke<GetTrackGeoJsonResponse | null>('getTrackGeoJson', {});
      if (trackData?.geoJsonContent) {
        const geoJsonContent = parseGeoJsonContent(trackData.geoJsonContent);

        setTrackLoaded(true);
        setTrackName(trackData.trackName);

        if (frameReady) {
          void events.emit('GEOJSON_LOAD', { geoJsonContent });
        } else {
          setPendingGeoJson(geoJsonContent);
        }
      } else {
        setTrackLoaded(false);
        setViewerStatus(getStatusWhenNoTrack());
      }
    } catch {
      setTrackLoaded(false);
      setViewerStatus(getStatusWhenNoTrack());
    }
  }, [frameReady]);

  useEffect(() => {
    void (async () => {
      try {
        await loadTrack();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadTrack]);

  useEffect(() => {
    if (!selectedSection) {
      setViewerStatus(getStatusForMode(viewerMode, trackLoaded));
    }
  }, [trackLoaded, viewerMode, selectedSection]);

  const handleReset = useCallback((): void => {
    void events.emit('TRACK_RESET', {});
    setSelectedSection(null);
    setViewerModeState('pan');
    syncViewerMode('pan');
    setViewerStatus(
      trackLoaded
        ? 'View reset. Pan / zoom or switch to Brush Select.'
        : getStatusWhenNoTrack(),
    );
  }, [trackLoaded, syncViewerMode]);

  const selectionSummary = useMemo(() => {
    if (!selectedSection) {
      return null;
    }
    return buildSelectionSummary(selectedSection);
  }, [selectedSection]);

  return {
    loading,
    trackLoaded,
    trackName,
    uploadModalOpen,
    setUploadModalOpen,
    selectedSection,
    setSelectedSection,
    selectionSummary,
    viewerMode,
    viewerStatus,
    setViewerMode,
    loadTrack,
    handleReset,
  };
};
