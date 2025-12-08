import { getFieldWithType } from 'utils/instances';
import type { Instance } from '../../../utils/instances';

interface BaseElementUsage {
  baseElementId: string;
  usedBy: string[];
}

// Note - this is using pass by reference to add to the baseElementsInUse array from getBaseElementsInUse
function addBaseElementUsage(uses: BaseElementUsage[], baseElementId: string, elementId: string): void {
  const baseElementAlreadyInUse = uses.find(s => s.baseElementId === baseElementId);
  if (baseElementAlreadyInUse == null) {
    // Add the base element id and begin the list of other instances using the base element
    uses.push({ baseElementId: baseElementId, usedBy: [elementId] });
  } else {
    // If the base element is already used elsewhere, just add to the list of instances using it
    baseElementAlreadyInUse.usedBy.push(elementId);
  }
}

export function getBaseElementsInUse(allElements: Instance[]): BaseElementUsage[] {
  const baseElementsInUse: BaseElementUsage[] = [];
  allElements
    .filter(element => element.fields) // filters out parameters
    .forEach(element => {
      // Handle base elements that are currently used
      const referenceField = getFieldWithType(element.fields, 'reference');
      if (referenceField?.id === 'baseElementReference' && referenceField.value && typeof referenceField.value === 'object' && 'id' in referenceField.value) {
        addBaseElementUsage(baseElementsInUse, referenceField.value.id as string, element.uniqueId || '');
      } else if (referenceField?.id === 'externalCqlReference' && referenceField.value && typeof referenceField.value === 'object' && 'arguments' in referenceField.value) {
        const args = referenceField.value.arguments as Array<{ value?: { argSource?: string; selected?: string } }>;
        args
          ?.map(arg => arg.value)
          .forEach(arg => {
            if (arg?.argSource && arg?.selected && arg.argSource === 'baseElement') {
              addBaseElementUsage(baseElementsInUse, arg.selected, element.uniqueId || '');
            }
          });
      }
      // Handle external cql modifiers
      element.modifiers?.forEach((modifier, index) => {
        if (modifier.type === 'ExternalModifier' && modifier.values && typeof modifier.values === 'object' && 'value' in modifier.values) {
          const modifierValues = modifier.values.value as Array<{ argSource?: string; selected?: string }>;
          modifierValues?.forEach(arg => {
            if (arg?.argSource && arg?.selected && arg.argSource === 'baseElement') {
              addBaseElementUsage(baseElementsInUse, arg.selected, element.uniqueId || '');
            }
          });
        }
      });
    });
  return baseElementsInUse;
}

