import { getFieldWithType } from 'utils/instances';
import type { Instance } from '../../../utils/instances';

interface ParameterUsage {
  parameterId: string;
  usedBy: string[];
}

// Note - this is using pass by reference to add to the parametersInUse array from getParametersInUse
function addParameterUsage(uses: ParameterUsage[], parameterId: string, elementId: string): void {
  const parameterAlreadyInUse = uses.find(p => p.parameterId === parameterId);
  if (parameterAlreadyInUse === undefined) {
    // Add the parameter id and begin the list of other instances using the parameter
    uses.push({ parameterId: parameterId, usedBy: [elementId] });
  } else {
    // If the parameter is already used elsewhere, just add to the list of instances using it
    parameterAlreadyInUse.usedBy.push(elementId);
  }
}

export function getParametersInUse(allElements: Instance[]): ParameterUsage[] {
  const parametersInUse: ParameterUsage[] = [];
  allElements
    .filter(element => element.fields) // filters out parameters
    .forEach(element => {
      // Handle parameters that are currently used
      const referenceField = getFieldWithType(element.fields, 'reference');
      const referenceFieldWithValue = referenceField as { type?: string; id?: string; value?: unknown } | undefined;
      if (
        referenceFieldWithValue?.id === 'parameterReference' &&
        referenceFieldWithValue.value &&
        typeof referenceFieldWithValue.value === 'object' &&
        'id' in referenceFieldWithValue.value
      ) {
        addParameterUsage(parametersInUse, (referenceFieldWithValue.value as { id: string }).id, element.uniqueId);
      } else if (
        referenceFieldWithValue?.id === 'externalCqlReference' &&
        referenceFieldWithValue.value &&
        typeof referenceFieldWithValue.value === 'object' &&
        'arguments' in referenceFieldWithValue.value
      ) {
        const args = (
          referenceFieldWithValue.value as { arguments?: Array<{ value?: { argSource?: string; selected?: string } }> }
        ).arguments;
        args
          ?.map(arg => arg.value)
          .forEach(arg => {
            if (arg?.argSource && arg?.selected && arg.argSource === 'parameter') {
              addParameterUsage(parametersInUse, arg.selected, element.uniqueId);
            }
          });
      }
      // Handle external cql modifiers
      element.modifiers?.forEach((modifier, index) => {
        if (
          modifier.type === 'ExternalModifier' &&
          modifier.values &&
          typeof modifier.values === 'object' &&
          'value' in modifier.values
        ) {
          const modifierValues = modifier.values.value as Array<{ argSource?: string; selected?: string }>;
          modifierValues?.forEach(arg => {
            if (arg?.argSource && arg?.selected && arg.argSource === 'parameter') {
              addParameterUsage(parametersInUse, arg.selected, element.uniqueId);
            }
          });
        }
      });
    });
  return parametersInUse;
}
