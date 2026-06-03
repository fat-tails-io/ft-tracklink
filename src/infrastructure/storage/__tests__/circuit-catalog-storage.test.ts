import { storage } from '@forge/api';
import {
  CIRCUIT_CATALOG_KEY,
  ensureCircuitCatalog,
  seedCircuitLibrary,
  upsertCircuit,
} from '../circuit-catalog-storage';

jest.mock('@forge/api', () => ({
  storage: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedStorage = storage as jest.Mocked<typeof storage>;

const memoryStore = new Map<string, unknown>();

describe('circuit-catalog-storage', () => {
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

  it('upsertCircuit writes catalog index', async () => {
    const catalog = await upsertCircuit({
      id: 'gb-1948',
      name: 'Silverstone Circuit',
      location: 'Silverstone',
    });

    expect(catalog.circuits).toHaveLength(1);
    expect(memoryStore.get(CIRCUIT_CATALOG_KEY)).toEqual(
      expect.objectContaining({
        circuits: [expect.objectContaining({ id: 'gb-1948' })],
      }),
    );
  });

  it('seedCircuitLibrary stores bundled geo for each circuit', async () => {
    const result = await seedCircuitLibrary();

    expect(result.seeded).toContain('gb-1948');
    expect(result.seeded).toContain('ae-2009');
    expect(result.catalog.circuits.length).toBeGreaterThanOrEqual(2);
  });

  it('ensureCircuitCatalog seeds when empty', async () => {
    const catalog = await ensureCircuitCatalog();
    expect(catalog.circuits.length).toBeGreaterThanOrEqual(2);
  });
});
