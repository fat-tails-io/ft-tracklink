import { storage } from '@forge/api';
import {
  appendTrackLink,
  getIssueTrackLinks,
  getTrackLink,
  deleteTrackLink,
  saveTrackGeoJson,
  TrackLinkLimitError,
} from '../track-link-storage';
import { MAX_TRACK_LINKS_PER_ISSUE } from '../../../domain/track-link/constants';

jest.mock('@forge/api', () => ({
  storage: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedStorage = storage as jest.Mocked<typeof storage>;
const memoryStore = new Map<string, unknown>();

describe('track-link-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memoryStore.clear();
    mockedStorage.set.mockImplementation((key: string, value: unknown) => {
      memoryStore.set(key, value);
      return Promise.resolve();
    });
    mockedStorage.get.mockImplementation((key: string) =>
      Promise.resolve((memoryStore.get(key) ?? null) as null),
    );
    mockedStorage.delete.mockImplementation((key: string) => {
      memoryStore.delete(key);
      return Promise.resolve();
    });
  });

  const baseEntry = {
    circuitId: 'gb-1948',
    viewport: { x: 0, y: 0, width: 100, height: 50, scale: 1 },
    trackRelative: {
      startDistanceM: 100,
      endDistanceM: 200,
      segmentLengthM: 100,
      totalCircuitLengthM: 5000,
    },
  };

  describe('appendTrackLink / getIssueTrackLinks', () => {
    it('appends multiple links up to the cap', async () => {
      await appendTrackLink('F1-42', baseEntry);
      await appendTrackLink('F1-42', {
        ...baseEntry,
        trackRelative: {
          startDistanceM: 500,
          endDistanceM: 600,
          segmentLengthM: 100,
        },
      });

      const bundle = await getIssueTrackLinks('F1-42');
      expect(bundle?.links).toHaveLength(2);
      expect(bundle?.links[0].linkIndex).toBe(0);
      expect(bundle?.links[1].linkIndex).toBe(1);
    });

    it('throws when max links reached', async () => {
      for (let i = 0; i < MAX_TRACK_LINKS_PER_ISSUE; i += 1) {
        await appendTrackLink('F1-99', baseEntry);
      }

      await expect(appendTrackLink('F1-99', baseEntry)).rejects.toBeInstanceOf(TrackLinkLimitError);
    });

    it('migrates legacy single TrackSection on read', async () => {
      memoryStore.set('track-section-F1-legacy', {
        issueKey: 'F1-legacy',
        viewport: baseEntry.viewport,
        circuitId: 'ae-2009',
        createdAt: 1_700_000_000_000,
      });

      const bundle = await getIssueTrackLinks('F1-legacy');
      expect(bundle?.links).toHaveLength(1);
      expect(bundle?.links[0].circuitId).toBe('ae-2009');
    });

    it('getTrackLink returns first link for backward compatibility', async () => {
      await appendTrackLink('F1-42', baseEntry);
      const legacy = await getTrackLink('F1-42');
      expect(legacy?.issueKey).toBe('F1-42');
      expect(legacy?.circuitId).toBe('gb-1948');
    });

    it('deletes all links for an issue', async () => {
      await appendTrackLink('F1-42', baseEntry);
      await deleteTrackLink('F1-42');
      const bundle = await getIssueTrackLinks('F1-42');
      expect(bundle).toBeNull();
    });
  });

  describe('saveTrackGeoJson / getTrackGeoJson', () => {
    it('requires circuitId when saving', async () => {
      await expect(
        saveTrackGeoJson({
          trackName: 'Silverstone',
          geoJsonContent: { type: 'FeatureCollection', features: [] },
        }),
      ).rejects.toThrow('circuitId');
    });

    it('uses per-circuit key when circuitId is provided', async () => {
      mockedStorage.set.mockResolvedValue(undefined);
      mockedStorage.get.mockResolvedValue(null);

      await saveTrackGeoJson({
        circuitId: 'ae-2009',
        trackName: 'Yas Marina',
        geoJsonContent: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { Name: 'Yas Marina Circuit', Location: 'Yas Marina' },
              geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
            },
          ],
        },
      });

      expect(mockedStorage.set).toHaveBeenCalledWith(
        'track-geojson-ae-2009',
        expect.objectContaining({
          trackName: 'Yas Marina',
        }),
      );
    });
  });
});
