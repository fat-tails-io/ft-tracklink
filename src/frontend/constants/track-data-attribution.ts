/** Shown in Track Linker UI — keep in sync with LICENSE/*.md */
export const TRACK_DATA_ATTRIBUTION = {
  title: 'Track data',
  collapsedSummary:
    'Bundled circuits use f1-circuits centerlines (MIT) and FastF1/MultiViewer-derived corner and marshal detail (visualization-grade).',
  expandActionLabel: 'Show attribution details',
  collapseActionLabel: 'Hide attribution details',
  layers: [
    {
      id: 'f1-circuits',
      label: 'Circuit centerlines',
      credit: 'f1-circuits (Tomislav Bacinger), MIT License',
    },
    {
      id: 'fastf1-multiviewer',
      label: 'Corners, marshal markers, and transposed racing-line detail',
      credit:
        'Derived offline via FastF1 (MIT) from circuit data provided by MultiViewer, per FastF1 CircuitInfo',
    },
  ],
  disclaimer:
    'Visualization-grade geometry for operational use in Jira—not survey-grade. Formula 1 and related marks are trademarks of their respective holders; this app is not affiliated with or endorsed by Formula 1 or MultiViewer.',
} as const;
