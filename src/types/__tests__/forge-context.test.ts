import {
  issueKeyFromExtension,
  projectKeyFromExtension,
  readJiraIssueActionExtension,
} from '../forge-context';
import type { ForgeProductContext } from '../forge-context';

describe('forge-context', () => {
  it('reads issue.key from documented extension shape', () => {
    const context: ForgeProductContext = {
      moduleKey: 'track-linker-issue-action',
      extension: {
        type: 'jira:issueAction',
        'issue.key': 'FT-42',
        'project.key': 'FT',
      },
    };

    const extension = readJiraIssueActionExtension(context);
    expect(issueKeyFromExtension(extension)).toBe('FT-42');
    expect(projectKeyFromExtension(extension)).toBe('FT');
  });

  it('falls back to nested issue and project objects', () => {
    const extension = readJiraIssueActionExtension({
      extension: {
        issue: { key: 'FT-99' },
        project: { key: 'DEMO' },
      },
    } as ForgeProductContext);

    expect(issueKeyFromExtension(extension)).toBe('FT-99');
    expect(projectKeyFromExtension(extension)).toBe('DEMO');
  });
});
