import {
  getStatusAfterSelection,
  getStatusForMode,
  getStatusWhenNoTrack,
} from '../viewer-status';

describe('viewer-status', () => {
  it('returns guidance when no track is loaded', () => {
    expect(getStatusWhenNoTrack()).toContain('Upload');
  });

  it('returns pan mode copy when track is loaded', () => {
    expect(getStatusForMode('pan', true)).toContain('Pan / Zoom');
  });

  it('returns brush mode copy when track is loaded', () => {
    expect(getStatusForMode('brush', true)).toContain('Brush Select');
  });

  it('returns upload prompt when track is not loaded regardless of mode', () => {
    expect(getStatusForMode('brush', false)).toBe(getStatusWhenNoTrack());
  });

  it('returns post-selection copy', () => {
    expect(getStatusAfterSelection()).toContain('Selection captured');
  });
});
