import { useMemo } from 'react';
import { useProductContext } from '@forge/react';
import {
  TRACK_LINKER_ISSUE_ACTION_KEY,
  issueKeyFromExtension,
  projectKeyFromExtension,
  readJiraIssueActionExtension,
} from '../../types/forge-context';

export type IssueProductContext = {
  issueKey?: string;
  projectKey?: string;
  extensionType?: string;
  moduleKey?: string;
  isIssueAction: boolean;
};

export const useIssueProductContext = (): IssueProductContext => {
  const productContext = useProductContext();

  return useMemo(() => {
    const moduleKey = productContext?.moduleKey;
    const extension = readJiraIssueActionExtension(productContext);

    return {
      issueKey: issueKeyFromExtension(extension),
      projectKey: projectKeyFromExtension(extension),
      extensionType: extension?.type,
      moduleKey,
      isIssueAction: moduleKey === TRACK_LINKER_ISSUE_ACTION_KEY,
    };
  }, [productContext]);
};
