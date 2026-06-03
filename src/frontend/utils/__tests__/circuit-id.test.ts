import { slugifyCircuitId } from '../circuit-id';

describe('slugifyCircuitId', () => {
  it('lowercases and hyphenates names', () => {
    expect(slugifyCircuitId('Silverstone Circuit')).toBe('silverstone-circuit');
  });
});
