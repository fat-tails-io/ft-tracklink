import { matchFieldForModule, resolveFieldIdOrKey } from '../resolve-forge-field-id';
import type { JiraFieldDefinition } from '../resolve-forge-field-id';

const appId = '0bc97e82-fe2f-4461-a3be-8e2600683210';
const envId = '4e9fe62d-2575-4b2d-b0d7-5a37f43a80a9';

const forgeField = (
  moduleKey: string,
  overrides: Partial<JiraFieldDefinition> = {},
): JiraFieldDefinition => ({
  id: 'customfield_10042',
  key: `${appId}__DEVELOPMENT__${moduleKey}`,
  name: 'F1 Circuit',
  schema: {
    custom: `ari:cloud:ecosystem::extension/${appId}/${envId}/static/${moduleKey}`,
    type: 'string',
  },
  ...overrides,
});

describe('matchFieldForModule', () => {
  it('matches by schema.custom static suffix', () => {
    const fields = [forgeField('track-circuit-field')];
    const match = matchFieldForModule(fields, 'track-circuit-field');
    expect(match?.id).toBe('customfield_10042');
  });

  it('matches by composite field key suffix', () => {
    const fields = [
      forgeField('track-segment-field', {
        id: 'customfield_10043',
        schema: undefined,
      }),
    ];
    const match = matchFieldForModule(fields, 'track-segment-field');
    expect(match?.id).toBe('customfield_10043');
  });
});

describe('resolveFieldIdOrKey', () => {
  it('returns customfield id for a known module', () => {
    const id = resolveFieldIdOrKey([forgeField('track-links-field')], 'track-links-field');
    expect(id).toBe('customfield_10042');
  });

  it('throws when module is missing from the catalog', () => {
    expect(() => resolveFieldIdOrKey([], 'track-circuit-field')).toThrow(/not found/i);
  });
});
