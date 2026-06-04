import type { TrackLinkEntry } from '../../types';

const adfText = (text: string) => ({
  type: 'text' as const,
  text,
});

const adfParagraph = (text: string) => ({
  type: 'paragraph' as const,
  content: [adfText(text)],
});

const formatCoord = (pair?: [number, number]): string => {
  if (!pair) {
    return 'N/A';
  }
  return pair.map((c) => c.toFixed(6)).join(', ');
};

/**
 * Atlassian Document Format body for a track-section link comment.
 */
export const buildTrackLinkCommentAdf = (
  link: Pick<TrackLinkEntry, 'circuitId' | 'trackRelative' | 'geo' | 'linkIndex'>,
  circuitDisplayName?: string,
): { type: 'doc'; version: 1; content: object[] } => {
  const circuitLabel = circuitDisplayName || link.circuitId;
  const alongTrack = link.trackRelative
    ? `${link.trackRelative.startDistanceM.toFixed(1)} m – ${link.trackRelative.endDistanceM.toFixed(1)} m (${link.trackRelative.segmentLengthM.toFixed(1)} m segment)`
    : 'Distance along track not available';

  const content: object[] = [
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [adfText(`Track section linked (#${link.linkIndex + 1})`)],
    },
    adfParagraph(`Circuit: ${circuitLabel} (${link.circuitId})`),
    adfParagraph(`Along track: ${alongTrack}`),
  ];

  if (link.geo?.start && link.geo?.end) {
    content.push(
      adfParagraph(`Start [lon, lat]: ${formatCoord(link.geo.start)}`),
      adfParagraph(`End [lon, lat]: ${formatCoord(link.geo.end)}`),
    );
  }

  content.push(
    adfParagraph('Linked via Formula 1 Track Linker.'),
  );

  return {
    type: 'doc',
    version: 1,
    content,
  };
};
