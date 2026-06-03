import Resolver, { type Request } from '@forge/resolver';
import { JiraService } from '../domain/services/jira-service';
import {
  storeTrackLink,
  getTrackLink,
  saveTrackSvg,
  getTrackSvg,
  saveTrackGeoJson,
  getTrackGeoJson,
  saveTheme,
  getTheme,
} from '../infrastructure/storage/track-link-storage';
import type {
  CreateTrackIssueRequest,
  CreateTrackIssueResponse,
  ThumbnailAttachmentRequest,
  SaveTrackSvgRequest,
  GetTrackSvgResponse,
  SaveTrackGeoJsonRequest,
  GetTrackGeoJsonResponse,
  SaveThemeRequest,
  TrackLink,
} from '../types';

type StoreTrackLinkPayload = {
  issueKey: string;
  viewport: TrackLink['viewport'];
  svgSectionId?: string;
};

const resolver = new Resolver();
const jiraService = new JiraService();

/**
 * Create JIRA issue with track section metadata
 */
resolver.define(
  'createTrackIssue',
  async (req: Request<CreateTrackIssueRequest>): Promise<CreateTrackIssueResponse> => {
    const { payload } = req;

    if (!payload.summary || !payload.projectKey || !payload.issueType) {
      throw new Error('Missing required fields: summary, projectKey, issueType');
    }

    const issueResponse = await jiraService.createIssue(payload);

    if (payload.thumbnailData) {
      try {
        await jiraService.attachThumbnail({
          issueKey: issueResponse.issueKey,
          thumbnailData: payload.thumbnailData,
          filename: `track-section-${issueResponse.issueKey}.png`,
        });
      } catch (error) {
        console.error('Failed to attach thumbnail:', error);
      }
    }

    await storeTrackLink(issueResponse.issueKey, {
      viewport: payload.viewport,
      svgSectionId: payload.svgSectionId,
    });

    return issueResponse;
  },
);

resolver.define(
  'attachTrackThumbnail',
  async (req: Request<ThumbnailAttachmentRequest>): Promise<void> => {
    const { payload } = req;

    if (!payload.issueKey || !payload.thumbnailData) {
      throw new Error('Missing required fields: issueKey, thumbnailData');
    }

    await jiraService.attachThumbnail(payload);
  },
);

resolver.define('storeTrackLink', async (req: Request<StoreTrackLinkPayload>): Promise<void> => {
  const { payload } = req;

  if (!payload.issueKey || !payload.viewport) {
    throw new Error('Missing required fields: issueKey, viewport');
  }

  await storeTrackLink(payload.issueKey, {
    viewport: payload.viewport,
    svgSectionId: payload.svgSectionId,
  });
});

resolver.define('getTrackLink', async (req: Request<{ issueKey: string }>): Promise<TrackLink | null> => {
  const { payload } = req;

  if (!payload.issueKey) {
    throw new Error('Missing required field: issueKey');
  }

  return await getTrackLink(payload.issueKey);
});

resolver.define(
  'getTrackSvg',
  async (req: Request<{ trackId?: string }>): Promise<GetTrackSvgResponse | null> => {
    const trackSvg = await getTrackSvg(req.payload?.trackId);

    if (!trackSvg) {
      return null;
    }

    return {
      svgContent: trackSvg.svgContent,
      trackName: trackSvg.trackName,
      uploadedAt: trackSvg.uploadedAt,
    };
  },
);

resolver.define('saveTrackSvg', async (req: Request<SaveTrackSvgRequest>): Promise<void> => {
  const { payload } = req;

  if (!payload.svgContent || !payload.trackName) {
    throw new Error('Missing required fields: svgContent, trackName');
  }

  await saveTrackSvg(payload);
});

resolver.define(
  'getTheme',
  async (
    req: Request<{ userId?: string }>,
  ): Promise<{ primaryColor: string; secondaryColor: string; accentColor: string; teamName?: string } | null> => {
    return await getTheme(req.payload?.userId);
  },
);

resolver.define(
  'getTrackGeoJson',
  async (req: Request<{ trackId?: string }>): Promise<GetTrackGeoJsonResponse | null> => {
    const trackGeoJson = await getTrackGeoJson(req.payload?.trackId);

    if (!trackGeoJson) {
      return null;
    }

    return {
      geoJsonContent: trackGeoJson.geoJsonContent,
      trackName: trackGeoJson.trackName,
      uploadedAt: trackGeoJson.uploadedAt,
    };
  },
);

resolver.define('saveTrackGeoJson', async (req: Request<SaveTrackGeoJsonRequest>): Promise<void> => {
  const { payload } = req;

  if (!payload.geoJsonContent || !payload.trackName) {
    throw new Error('Missing required fields: geoJsonContent, trackName');
  }

  await saveTrackGeoJson(payload);
});

resolver.define('saveTheme', async (req: Request<SaveThemeRequest>): Promise<void> => {
  const { payload } = req;

  if (!payload.theme) {
    throw new Error('Missing required field: theme');
  }

  await saveTheme(payload);
});

export const handler = resolver.getDefinitions();
