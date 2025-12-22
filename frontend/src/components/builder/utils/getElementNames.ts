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
    const value = nameField && 'value' in nameField ? nameField.value : undefined;
    if (typeof value === 'string') return value;
    return '';
  }
  return element.name || '';
};

const getElementNames = (allElements: Instance[]): ElementName[] => {
  return allElements.map(element => ({ name: getElementName(element), id: element.uniqueId }));
};

export default getElementNames;
