import _ from 'lodash';
import type { Instance } from '../../../utils/instances';
import type { Artifact } from '../../../types/artifact';

export const elementsInclude = (elements: Instance[], elementName: string): boolean => {
  if (!elements || elements.length === 0) return false;
  if (elements.some(e => e.name === elementName)) return true;
  return false;
};

export function getElements(tabName: string, elements: Instance[], flattenedElements: Instance[] = []): Instance[] {
  elements.forEach(childElement => {
    const elementToPush = _.cloneDeep(childElement);
    childElement.tab = tabName;
    flattenedElements.push(elementToPush);
    if (childElement.childInstances && childElement.childInstances.length > 0)
      getElements(tabName, childElement.childInstances, flattenedElements);
  });

  return flattenedElements;
}

const getAllElements = (artifact: Artifact): Instance[] => {
  const { expTreeInclude, expTreeExclude, subpopulations, baseElements, parameters } = artifact;

  return getElements('expTreeInclude', expTreeInclude?.childInstances || []).concat(
    getElements('expTreeExclude', expTreeExclude?.childInstances || [])
      .concat(
        getElements(
          'subpopulations',
          (subpopulations || []).filter(({ special }) => !special)
        )
      )
      .concat(getElements('baseElements', baseElements || []))
      .concat(getElements('parameters', parameters || []))
  );
};

export default getAllElements;

