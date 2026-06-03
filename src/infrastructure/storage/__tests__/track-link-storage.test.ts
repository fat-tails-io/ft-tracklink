import { storage } from '@forge/api';
import {
  storeTrackLink,
  getTrackLink,
  deleteTrackLink,
  saveTrackGeoJson,
  getTrackGeoJson,
} from '../track-link-storage';
import type { TrackSection } from '../../../types';

jest.mock('@forge/api', () => ({
  storage: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedStorage = storage as jest.Mocked<typeof storage>;

describe('track-link-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeTrackLink / getTrackLink / deleteTrackLink', () => {
    const section: Omit<TrackSection, 'issueKey' | 'createdAt'> = {
      viewport: { x: 0, y: 0, width: 100, height: 50, scale: 1 },
    };

    it('stores and retrieves a track link by issue key', async () => {
      mockedStorage.set.mockResolvedValue(undefined);
      mockedStorage.get.mockResolvedValue({
        ...section,
        issueKey: 'F1-42',
        createdAt: 1_700_000_000_000,
      });

      await storeTrackLink('F1-42', section);

      expect(mockedStorage.set).toHaveBeenCalledWith(
        'track-section-F1-42',
        expect.objectContaining({
          issueKey: 'F1-42',
          viewport: section.viewport,
          createdAt: expect.any(Number) as number,
        }),
      );

      const link = await getTrackLink('F1-42');
      expect(mockedStorage.get).toHaveBeenCalledWith('track-section-F1-42');
      expect(link?.issueKey).toBe('F1-42');
    });

    it('returns null when no link exists', async () => {
      mockedStorage.get.mockResolvedValue(null);
      const link = await getTrackLink('F1-99');
      expect(link).toBeNull();
    });

    it('deletes a track link by issue key', async () => {
      mockedStorage.delete.mockResolvedValue(undefined);
      await deleteTrackLink('F1-42');
      expect(mockedStorage.delete).toHaveBeenCalledWith('track-section-F1-42');
    });
  });

  describe('saveTrackGeoJson / getTrackGeoJson', () => {
    it('uses default track-geojson key when trackId is omitted', async () => {
      mockedStorage.set.mockResolvedValue(undefined);
      await saveTrackGeoJson({
        trackName: 'Silverstone',
        geoJsonContent: { type: 'FeatureCollection', features: [] },
      });

      expect(mockedStorage.set).toHaveBeenCalledWith(
        'track-geojson',
        expect.objectContaining({
          trackName: 'Silverstone',
          uploadedAt: expect.any(Number) as number,
        }),
      );
    });

    it('uses per-circuit key when trackId is provided', async () => {
      mockedStorage.get.mockResolvedValue({
        geoJsonContent: '{"type":"FeatureCollection","features":[]}',
        trackName: 'Yas Marina',
        uploadedAt: 1,
      });

      await getTrackGeoJson('ae-2009');

      expect(mockedStorage.get).toHaveBeenCalledWith('track-geojson-ae-2009');
    });
  });
});
