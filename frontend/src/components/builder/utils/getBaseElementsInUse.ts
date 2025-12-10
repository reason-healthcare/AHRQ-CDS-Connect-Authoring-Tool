import { getFieldWithType } from 'utils/instances';
import type { Instance } from '../../../utils/instances';

interface BaseElementUsage {
  baseElementId: string;
  usedBy: string[];
}

type FieldValueRecursive =
  | string
  | number
  | boolean
  | { id: string; [key: string]: FieldValueRecursive }
  | { arguments?: Array<{ value?: { argSource?: string; selected?: string } }>; [key: string]: FieldValueRecursive }
  | Array<{ value?: { argSource?: string; selected?: string } }>
  | null
  | undefined;

interface FieldValueWithId {
  id: string;
  [key: string]: FieldValueRecursive;
}

interface FieldValueWithArguments {
  arguments?: Array<{ value?: { argSource?: string; selected?: string } }>;
  [key: string]: FieldValueRecursive;
}

interface FieldWithValue {
  type?: string;
  id?: string;
  value?: FieldValueWithId | FieldValueWithArguments | string | number | boolean | null;
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
      const referenceField = getFieldWithType(element.fields, 'reference') as FieldWithValue | undefined;
      if (
        referenceField?.id === 'baseElementReference' &&
        referenceField.value &&
        typeof referenceField.value === 'object' &&
        'id' in referenceField.value
      ) {
        const valueWithId = referenceField.value as FieldValueWithId;
        if (valueWithId.id) {
          addBaseElementUsage(baseElementsInUse, valueWithId.id, element.uniqueId || '');
        }
      } else if (
        referenceField?.id === 'externalCqlReference' &&
        referenceField.value &&
        typeof referenceField.value === 'object' &&
        'arguments' in referenceField.value
      ) {
        const valueWithArgs = referenceField.value as FieldValueWithArguments;
        const args = valueWithArgs.arguments;
        args
          ?.map(arg => arg.value)
          .forEach(arg => {
            if (arg?.argSource && arg?.selected && arg.argSource === 'baseElement') {
              addBaseElementUsage(baseElementsInUse, arg.selected, element.uniqueId || '');
            }
          });
      }
      // Handle external cql modifiers
      element.modifiers?.forEach(modifier => {
        if (
          modifier.type === 'ExternalModifier' &&
          modifier.values &&
          typeof modifier.values === 'object' &&
          'value' in modifier.values
        ) {
          const modifierValue = modifier.values.value;
          if (Array.isArray(modifierValue)) {
            modifierValue.forEach((arg: { argSource?: string; selected?: string }) => {
              if (arg?.argSource && arg?.selected && arg.argSource === 'baseElement') {
                addBaseElementUsage(baseElementsInUse, arg.selected, element.uniqueId || '');
              }
            });
          }
        }
      });
    });
  return baseElementsInUse;
}
