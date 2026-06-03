/** Corner points merged at seed time for NL / Rovo resolution (Phase 7). */

export interface BundledCornerDef {
  number: number;
  name: string;
  coordinates: [number, number];
}

export const BUNDLED_CORNERS: Record<string, BundledCornerDef[]> = {
  'gb-1948': [
    { number: 1, name: 'Turn 1', coordinates: [-1.015349, 52.07879] },
    { number: 2, name: 'Turn 2', coordinates: [-1.010353, 52.076457] },
    { number: 3, name: 'Turn 3', coordinates: [-1.009341, 52.070692] },
    { number: 4, name: 'Turn 4', coordinates: [-1.019202, 52.064399] },
    { number: 5, name: 'Turn 5', coordinates: [-1.024286, 52.067468] },
    { number: 6, name: 'Turn 6', coordinates: [-1.013289, 52.072526] },
    { number: 7, name: 'Turn 7', coordinates: [-1.018841, 52.077131] },
  ],
  'ae-2009': [
    { number: 1, name: 'Turn 1', coordinates: [54.605463, 24.46997] },
    { number: 2, name: 'Turn 2', coordinates: [54.606392, 24.472968] },
    { number: 3, name: 'Turn 3', coordinates: [54.605436, 24.47864] },
    { number: 4, name: 'Turn 4', coordinates: [54.601727, 24.468444] },
    { number: 5, name: 'Turn 5', coordinates: [54.608938, 24.463158] },
    { number: 6, name: 'Turn 6', coordinates: [54.605756, 24.465281] },
    { number: 7, name: 'Turn 7', coordinates: [54.605845, 24.467941] },
  ],
};
