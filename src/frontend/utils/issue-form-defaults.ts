export const DEFAULT_ISSUE_TYPE = 'Task';

export const buildDefaultSummary = (trackName: string): string =>
  `Track section - ${trackName || 'Track'}`;
