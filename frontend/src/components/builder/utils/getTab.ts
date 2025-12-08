const tabLabelMap: Record<string, string> = {
  summary: 'Summary',
  expTreeInclude: 'Inclusions',
  expTreeExclude: 'Exclusions',
  subpopulations: 'Subpopulations',
  baseElements: 'Base Element',
  recommendations: 'Recommendations',
  parameters: 'Parameters',
  errors: 'HandleErrors',
  externalCql: 'External CQL'
};

const getTabIndexFromName = (tabName: string): number => {
  return Object.keys(tabLabelMap).indexOf(tabName);
};

const getTabNameFromIndex = (tabIndex: number): string => {
  return Object.values(tabLabelMap)[tabIndex] || '';
};

export { getTabIndexFromName, getTabNameFromIndex };

