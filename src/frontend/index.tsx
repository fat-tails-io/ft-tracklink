import React from 'react';
import ForgeReconciler from '@forge/react';
import { GlobalTrackLinker } from './GlobalTrackLinker';
import { IssueTrackLinker } from './IssueTrackLinker';
import { useIssueProductContext } from './hooks/useIssueProductContext';

const App = (): React.JSX.Element => {
  const { isIssueAction } = useIssueProductContext();

  if (isIssueAction) {
    return <IssueTrackLinker />;
  }

  return <GlobalTrackLinker />;
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
