import { getFieldWithType } from 'utils/instances';
import type { Instance } from '../../../utils/instances';

export function getLibrariesInUse(allElements: Instance[]): string[] {
  const librariesInUse: string[] = [];
  allElements
    .filter(element => element.fields) // filters out parameters
    .forEach(element => {
      // Handle libraries that are currently used
      const referenceField = getFieldWithType(element.fields, 'reference');
      if (referenceField?.id === 'externalCqlReference' && referenceField.value && typeof referenceField.value === 'object' && 'library' in referenceField.value) {
        const library = referenceField.value.library as string;
        if (!librariesInUse.some(l => l === library)) {
          librariesInUse.push(library);
        }
      }
      // Handle external cql modifiers
      element.modifiers?.forEach(modifier => {
        if (modifier.type === 'ExternalModifier' && modifier.libraryName) {
          if (!librariesInUse.some(l => l === modifier.libraryName)) {
            librariesInUse.push(modifier.libraryName);
          }
        }
      });
    });
  return librariesInUse;
}

