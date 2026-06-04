import Resolver, { type Request } from '@forge/resolver';
import { JiraService } from '../domain/services/jira-service';
import { persistSelectionOnIssue } from '../domain/track-link/persist-issue-track-link';
import { MAX_TRACK_LINKS_PER_ISSUE } from '../domain/track-link/constants';
import {
  getIssueTrackLinks,
  storeTrackLink,
  getTrackLink,
  saveTrackSvg,
  getTrackSvg,
  saveTrackGeoJson,
  getTrackGeoJson,
  saveTheme,
  getTheme,
} from '../infrastructure/storage/track-link-storage';
import {
  deleteCircuit,
  ensureCircuitCatalog,
  getCircuitGeoJson,
  resolveActiveCircuitId,
  seedCircuitLibrary,
  setLastCircuit,
} from '../infrastructure/storage/circuit-catalog-storage';
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
  LinkSelectionToIssueRequest,
  LinkSelectionToIssueResponse,
  CreateLinkedTrackIssueRequest,
  CreateLinkedTrackIssueResponse,
  GetIssueTrackContextResponse,
  ListCircuitsResponse,
  GetCircuitGeoJsonRequest,
  SeedCircuitLibraryResponse,
  SetLastCircuitRequest,
  CircuitCatalog,
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
      circuitId: payload.circuitId,
      trackRelative: payload.trackRelative,
      geo: payload.geo,
      sampledPoints: payload.sampledPoints,
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
  'getIssueTrackContext',
  async (req: Request<{ issueKey: string }>): Promise<GetIssueTrackContextResponse> => {
    const { issueKey } = req.payload ?? {};
    if (!issueKey) {
      throw new Error('Missing required field: issueKey');
    }

    const issue = await jiraService.getIssue(issueKey);
    const bundle = await getIssueTrackLinks(issueKey);
    const links = bundle?.links ?? [];
    const linkCount = links.length;

    return {
      issueKey,
      summary: issue.fields.summary,
      links,
      linkCount,
      maxLinks: MAX_TRACK_LINKS_PER_ISSUE,
      canAddLink: linkCount < MAX_TRACK_LINKS_PER_ISSUE,
    };
  },
);

resolver.define(
  'linkSelectionToIssue',
  async (req: Request<LinkSelectionToIssueRequest>): Promise<LinkSelectionToIssueResponse> => {
    const { payload } = req;
    if (!payload?.issueKey) {
      throw new Error('Missing required field: issueKey');
    }
    return persistSelectionOnIssue(payload);
  },
);

resolver.define(
  'createLinkedTrackIssue',
  async (req: Request<CreateLinkedTrackIssueRequest>): Promise<CreateLinkedTrackIssueResponse> => {
    const { payload } = req;

    if (!payload?.parentIssueKey || !payload.projectKey || !payload.summary) {
      throw new Error('Missing required fields: parentIssueKey, projectKey, summary');
    }
    if (!payload.circuitId || !payload.viewport) {
      throw new Error('Missing required fields: circuitId, viewport');
    }

    const descriptionAdf = payload.description
      ? {
          type: 'doc' as const,
          version: 1 as const,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: payload.description }],
            },
          ],
        }
      : undefined;

    const subtask = await jiraService.createSubtaskIssue({
      parentIssueKey: payload.parentIssueKey,
      projectKey: payload.projectKey,
      summary: payload.summary,
      descriptionAdf,
    });

    const linkResult = await persistSelectionOnIssue({
      issueKey: subtask.issueKey,
      circuitId: payload.circuitId,
      circuitDisplayName: payload.circuitDisplayName,
      viewport: payload.viewport,
      trackRelative: payload.trackRelative,
      geo: payload.geo,
      sampledPoints: payload.sampledPoints,
      thumbnailData: payload.thumbnailData,
    });

    return {
      issueKey: subtask.issueKey,
      linkId: linkResult.linkId,
      success: true,
    };
  },
);

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

const toGeoJsonResponse = (
  trackGeoJson: Awaited<ReturnType<typeof getTrackGeoJson>>,
  circuitId?: string,
): GetTrackGeoJsonResponse | null => {
  if (!trackGeoJson) {
    return null;
  }
  return {
    geoJsonContent: trackGeoJson.geoJsonContent,
    trackName: trackGeoJson.trackName,
    uploadedAt: trackGeoJson.uploadedAt,
    circuitId,
  };
};

resolver.define('listCircuits', async (req: Request<{ accountId?: string }>): Promise<ListCircuitsResponse> => {
  const catalog = await ensureCircuitCatalog();
  const accountId = req.payload?.accountId;
  const lastCircuitId = accountId ? await resolveActiveCircuitId(accountId) : catalog.defaultCircuitId;

  return { catalog, lastCircuitId };
});

resolver.define(
  'getCircuitGeoJson',
  async (req: Request<GetCircuitGeoJsonRequest>): Promise<GetTrackGeoJsonResponse | null> => {
    const { circuitId } = req.payload ?? {};
    if (!circuitId) {
      throw new Error('Missing required field: circuitId');
    }

    const trackGeoJson = await getCircuitGeoJson(circuitId);
    return toGeoJsonResponse(trackGeoJson, circuitId);
  },
);

resolver.define(
  'seedCircuitLibrary',
  async (req: Request<{ forceGeo?: boolean }>): Promise<SeedCircuitLibraryResponse> => {
    const result = await seedCircuitLibrary({ forceGeo: req.payload?.forceGeo });
    return result;
  },
);

resolver.define('setLastCircuit', async (req: Request<SetLastCircuitRequest>): Promise<void> => {
  const { circuitId, accountId } = req.payload ?? {};
  if (!circuitId) {
    throw new Error('Missing required field: circuitId');
  }
  await setLastCircuit(circuitId, accountId);
});

resolver.define('deleteCircuit', async (req: Request<{ circuitId: string }>): Promise<CircuitCatalog> => {
  const { circuitId } = req.payload ?? {};
  if (!circuitId) {
    throw new Error('Missing required field: circuitId');
  }
  return await deleteCircuit(circuitId);
});

resolver.define(
  'getTrackGeoJson',
  async (req: Request<{ trackId?: string; circuitId?: string; accountId?: string }>): Promise<GetTrackGeoJsonResponse | null> => {
    const circuitId = req.payload?.circuitId ?? req.payload?.trackId;
    const accountId = req.payload?.accountId;
    const trackGeoJson = await getTrackGeoJson(circuitId, accountId);
    const resolvedId = circuitId ?? (trackGeoJson ? await resolveActiveCircuitId(accountId) : undefined);

    return toGeoJsonResponse(trackGeoJson, resolvedId);
  },
);

resolver.define('saveTrackGeoJson', async (req: Request<SaveTrackGeoJsonRequest>): Promise<void> => {
  const { payload } = req;

  if (!payload.geoJsonContent || !payload.trackName) {
    throw new Error('Missing required fields: geoJsonContent, trackName');
  }

  const circuitId = payload.circuitId ?? payload.trackId;
  if (!circuitId) {
    throw new Error('Missing required field: circuitId (or trackId)');
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
