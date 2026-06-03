import { buildDefaultSummary } from '../issue-form-defaults';

describe('buildDefaultSummary', () => {
  it('includes the active track name', () => {
    expect(buildDefaultSummary('Yas Marina Circuit')).toBe('Track section - Yas Marina Circuit');
  });

  it('falls back when track name is empty', () => {
    expect(buildDefaultSummary('')).toBe('Track section - Track');
  });
});
