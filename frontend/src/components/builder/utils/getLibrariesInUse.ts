import { getFieldWithType } from 'utils/instances';
import type { Instance, Modifier } from '../../../utils/instances';

interface FieldWithValue {
  type?: string;
  id?: string;
  value?: {
    library?: string;
    [key: string]:
      | string
      | number
      | boolean
      | { library?: string; [key: string]: string | number | boolean | null | undefined }
      | null
      | undefined;
  };
}

interface ExternalModifierWithLibrary extends Modifier {
  type: 'ExternalModifier';
  libraryName?: string;
}

export function getLibrariesInUse(allElements: Instance[]): string[] {
  const librariesInUse: string[] = [];
  allElements
    .filter(element => element.fields) // filters out parameters
    .forEach(element => {
      // Handle libraries that are currently used
      const referenceField = getFieldWithType(element.fields, 'reference') as FieldWithValue | undefined;
      if (
        referenceField?.id === 'externalCqlReference' &&
        referenceField.value &&
        typeof referenceField.value === 'object' &&
        'library' in referenceField.value
      ) {
        const valueWithLibrary = referenceField.value as {
          library?: string;
          [key: string]: string | number | boolean | null | undefined;
        };
        const library = valueWithLibrary.library;
        if (library && typeof library === 'string' && !librariesInUse.some(l => l === library)) {
          librariesInUse.push(library);
        }
      }
      // Handle external cql modifiers
      element.modifiers?.forEach(modifier => {
        const externalModifier = modifier as ExternalModifierWithLibrary;
        if (externalModifier.type === 'ExternalModifier' && externalModifier.libraryName) {
          if (!librariesInUse.some(l => l === externalModifier.libraryName)) {
            librariesInUse.push(externalModifier.libraryName);
          }
        }
      });
    });
  return librariesInUse;
}
