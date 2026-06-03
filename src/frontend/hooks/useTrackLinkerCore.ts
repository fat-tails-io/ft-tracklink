import { useCallback, useEffect, useMemo, useState } from 'react';
import { events, invoke, showFlag } from '@forge/bridge';
import type { GetTrackGeoJsonResponse } from '../../types';
import type { TrackSelectionPayload } from '../types/track-selection';
import { buildSelectionSummary } from '../utils/selection-format';

export type UseTrackLinkerCoreResult = {
  loading: boolean;
  trackLoaded: boolean;
  trackName: string;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  selectedSection: TrackSelectionPayload | null;
  setSelectedSection: (section: TrackSelectionPayload | null) => void;
  selectionSummary: ReturnType<typeof buildSelectionSummary> | null;
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
  }, [pendingGeoJson]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void events
      .on('TRACK_SECTION_SELECTED', (eventData) => {
        const payload = eventData as TrackSelectionPayload;
        setSelectedSection(payload);
        showFlag({
          id: 'track-section-captured',
          title: 'Track section captured',
          type: 'info',
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
      }
    } catch {
      setTrackLoaded(false);
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

  const handleReset = useCallback((): void => {
    void events.emit('TRACK_RESET', {});
    setSelectedSection(null);
  }, []);

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
    loadTrack,
    handleReset,
  };
};
