import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { events, invoke, showFlag } from '@forge/bridge';
import type {
  CircuitSummary,
  GetTrackGeoJsonResponse,
  ListCircuitsResponse,
} from '../../types';
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

export type UseTrackLinkerCoreOptions = {
  accountId?: string;
};

export type UseTrackLinkerCoreResult = {
  loading: boolean;
  trackLoaded: boolean;
  trackName: string;
  circuits: CircuitSummary[];
  selectedCircuitId: string | undefined;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  selectedSection: TrackSelectionPayload | null;
  setSelectedSection: (section: TrackSelectionPayload | null) => void;
  selectionSummary: ReturnType<typeof buildSelectionSummary> | null;
  viewerMode: ViewerInteractionMode;
  viewerStatus: string;
  setViewerMode: (mode: ViewerInteractionMode) => void;
  loadTrack: (circuitId?: string) => Promise<void>;
  selectCircuit: (circuitId: string) => Promise<void>;
  refreshCatalog: () => Promise<string | undefined>;
  handleReset: () => void;
};

const parseGeoJsonContent = (raw: string | object): unknown => {
  if (typeof raw === 'string') {
    return JSON.parse(raw) as unknown;
  }
  return raw;
};

export const useTrackLinkerCore = (
  options: UseTrackLinkerCoreOptions = {},
): UseTrackLinkerCoreResult => {
  const { accountId } = options;
  const [loading, setLoading] = useState<boolean>(true);
  const [trackLoaded, setTrackLoaded] = useState<boolean>(false);
  const [trackName, setTrackName] = useState<string>('');
  const [circuits, setCircuits] = useState<CircuitSummary[]>([]);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string | undefined>();
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [frameReady, setFrameReady] = useState<boolean>(false);
  const [pendingGeoJson, setPendingGeoJson] = useState<unknown>(null);
  const [selectedSection, setSelectedSection] = useState<TrackSelectionPayload | null>(null);
  const [viewerMode, setViewerModeState] = useState<ViewerInteractionMode>('pan');
  const [viewerStatus, setViewerStatus] = useState<string>(getStatusWhenNoTrack());
  const viewerModeRef = useRef<ViewerInteractionMode>(viewerMode);
  const selectedCircuitIdRef = useRef<string | undefined>(selectedCircuitId);
  viewerModeRef.current = viewerMode;
  selectedCircuitIdRef.current = selectedCircuitId;

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

  const emitGeoJson = useCallback(
    (geoJsonContent: unknown): void => {
      if (frameReady) {
        void events.emit('GEOJSON_LOAD', { geoJsonContent });
      } else {
        setPendingGeoJson(geoJsonContent);
      }
    },
    [frameReady],
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

  const refreshCatalog = useCallback(async (): Promise<string | undefined> => {
    const listResponse = await invoke<ListCircuitsResponse>('listCircuits', { accountId });
    setCircuits(listResponse.catalog.circuits);

    const activeId =
      listResponse.lastCircuitId ??
      listResponse.catalog.defaultCircuitId ??
      listResponse.catalog.circuits[0]?.id;

    if (activeId) {
      setSelectedCircuitId(activeId);
      selectedCircuitIdRef.current = activeId;
    }
    return activeId;
  }, [accountId]);

  const loadTrack = useCallback(
    async (circuitId?: string): Promise<void> => {
      const id = circuitId ?? selectedCircuitIdRef.current;
      if (!id) {
        setTrackLoaded(false);
        setViewerStatus(getStatusWhenNoTrack());
        return;
      }

      try {
        const trackData = await invoke<GetTrackGeoJsonResponse | null>('getTrackGeoJson', {
          circuitId: id,
          accountId,
        });

        if (trackData?.geoJsonContent) {
          const geoJsonContent = parseGeoJsonContent(trackData.geoJsonContent);

          setTrackLoaded(true);
          setTrackName(trackData.trackName);
          setSelectedCircuitId(trackData.circuitId ?? id);
          emitGeoJson(geoJsonContent);
        } else {
          setTrackLoaded(false);
          setViewerStatus(getStatusWhenNoTrack());
        }
      } catch {
        setTrackLoaded(false);
        setViewerStatus(getStatusWhenNoTrack());
      }
    },
    [accountId, emitGeoJson],
  );

  const selectCircuit = useCallback(
    async (circuitId: string): Promise<void> => {
      setSelectedCircuitId(circuitId);
      setSelectedSection(null);
      await invoke('setLastCircuit', { circuitId, accountId });
      await loadTrack(circuitId);
    },
    [accountId, loadTrack],
  );

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) {
      return;
    }
    initRef.current = true;

    void (async () => {
      try {
        await invoke('seedCircuitLibrary', {});
        const activeId = await refreshCatalog();
        if (activeId) {
          await loadTrack(activeId);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshCatalog, loadTrack]);

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
    circuits,
    selectedCircuitId,
    uploadModalOpen,
    setUploadModalOpen,
    selectedSection,
    setSelectedSection,
    selectionSummary,
    viewerMode,
    viewerStatus,
    setViewerMode,
    loadTrack,
    selectCircuit,
    refreshCatalog,
    handleReset,
  };
};
