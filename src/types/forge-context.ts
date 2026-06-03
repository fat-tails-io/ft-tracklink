/** Subset of @forge/bridge FullContext used by useProductContext (FullContext is not re-exported from the package root). */
export type ForgeProductContext = {
  moduleKey?: string;
  extension?: JiraIssueActionExtension;
};

/**
 * Documented extension fields for jira:issueAction (UI Kit / Custom UI).
 * @see https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-action/
 */
export interface JiraIssueActionExtension {
  type?: string;
  'issue.id'?: string;
  'issue.key'?: string;
  'issue.type'?: string;
  'issue.typeId'?: string;
  'project.id'?: string;
  'project.key'?: string;
  'project.type'?: string;
  location?: string;
  /** Nested shapes seen in some Forge runtime versions */
  issue?: { id?: string; key?: string; type?: string; typeId?: string };
  project?: { id?: string; key?: string; type?: string };
  issueKey?: string;
  projectKey?: string;
}

export const TRACK_LINKER_ISSUE_ACTION_KEY = 'track-linker-issue-action';

export const readJiraIssueActionExtension = (
  productContext: ForgeProductContext | undefined,
): JiraIssueActionExtension | undefined => productContext?.extension;

export const issueKeyFromExtension = (extension: JiraIssueActionExtension | undefined): string | undefined =>
  extension?.['issue.key'] ?? extension?.issue?.key ?? extension?.issueKey;

export const projectKeyFromExtension = (
  extension: JiraIssueActionExtension | undefined,
): string | undefined => extension?.['project.key'] ?? extension?.project?.key ?? extension?.projectKey;
