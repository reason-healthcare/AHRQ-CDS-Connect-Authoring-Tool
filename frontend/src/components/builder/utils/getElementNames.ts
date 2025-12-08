import { getFieldWithId } from 'utils/instances';
import type { Instance } from '../../../utils/instances';

interface ElementName {
  name: string;
  id: string;
}

const getElementName = (element: Instance): string => {
  if (element.subpopulationName) return element.subpopulationName;
  if (element.fields) {
    const nameField = getFieldWithId(element.fields, 'element_name');
    return (nameField?.value as string) || '';
  }
  return element.name || '';
};

const getElementNames = (allElements: Instance[]): ElementName[] => {
  return allElements.map(element => ({ name: getElementName(element), id: element.uniqueId || '' }));
};

export default getElementNames;

