import { buildTrackLinkCommentAdf } from '../track-link-comment';

describe('buildTrackLinkCommentAdf', () => {
  it('includes circuit and distance range in ADF', () => {
    const doc = buildTrackLinkCommentAdf(
      {
        circuitId: 'gb-1948',
        linkIndex: 0,
        trackRelative: {
          startDistanceM: 1200.5,
          endDistanceM: 1580.2,
          segmentLengthM: 379.7,
        },
        geo: {
          start: [-1.01, 52.07],
          end: [-1.02, 52.08],
        },
      },
      'Silverstone Circuit',
    );

    expect(doc.type).toBe('doc');
    expect(doc.content.length).toBeGreaterThan(2);
    const flat = JSON.stringify(doc);
    expect(flat).toContain('Silverstone Circuit');
    expect(flat).toContain('gb-1948');
    expect(flat).toContain('1200.5 m');
  });
});
