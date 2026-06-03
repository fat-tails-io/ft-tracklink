import React from 'react';
import ForgeReconciler from '@forge/react';
import { GlobalTrackLinker } from './GlobalTrackLinker';
import { IssueTrackLinker } from './IssueTrackLinker';
import { useIssueProductContext } from './hooks/useIssueProductContext';
import { useAppTheme } from './hooks/useAppTheme';

const App = (): React.JSX.Element => {
  const themeKey = useAppTheme();
  const { isIssueAction } = useIssueProductContext();

  if (isIssueAction) {
    return <IssueTrackLinker key={themeKey} />;
  }

  return <GlobalTrackLinker key={themeKey} />;
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
