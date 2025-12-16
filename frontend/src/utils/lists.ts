import _ from 'lodash';
import { plural } from 'pluralize';
import { getReturnType, type Modifier } from 'utils/instances';
import { findValueAtPath } from './find';

// These lists are based off the lists defined in api/src/data/modifiers.js
// in order to ensure any type will have modifiers available for it.
const listTypes = [
  'list_of_allergy_intolerances',
  'list_of_any',
  'list_of_booleans',
  'list_of_conditions',
  'list_of_datetimes',
  'list_of_decimals',
  'list_of_devices',
  'list_of_encounters',
  'list_of_immunizations',
  'list_of_integers',
  'list_of_medication_requests',
  'list_of_medication_statements',
  'list_of_observations',
  'list_of_others',
  'list_of_procedures',
  'list_of_service_requests',
  'list_of_strings',
  'list_of_system_codes',
  'list_of_system_concepts',
  'list_of_system_quantities',
  'list_of_times'
] as const;

export const isElementAndOr = (id: string | undefined): boolean => id === 'And' || id === 'Or';
export const isElementUnionIntersect = (id: string | undefined): boolean => id === 'Union' || id === 'Intersect';

export const promoteReturnTypeToList = (returnType: string): string => {
  // Handle empty string - return list_of_any as default
  if (!returnType || returnType === '') {
    return 'list_of_any';
  }
  const isSingularElement = !returnType.startsWith('list_of_');
  if (isSingularElement) {
    return `list_of_${plural(returnType)}`;
  }
  return returnType;
};

export const checkReturnTypeCompatibilitySetList = (currentReturnType: string, incomingReturnType: string): string => {
  const incomingReturnTypeOrPromoted = promoteReturnTypeToList(incomingReturnType);
  const isListElement = listTypes.find(type => type === incomingReturnTypeOrPromoted);
  if (currentReturnType === incomingReturnTypeOrPromoted && isListElement) {
    return incomingReturnTypeOrPromoted;
  }
  return 'list_of_any';
};

export const checkReturnTypeCompatibilityBooleanList = (
  currentReturnType: string,
  incomingReturnType: string,
  isOnlyElement: boolean
): string => {
  const booleanAndNull =
    (_.lowerCase(incomingReturnType) === 'none' && _.lowerCase(currentReturnType) === 'boolean') ||
    (_.lowerCase(incomingReturnType) === 'boolean' && _.lowerCase(currentReturnType) === 'none');

  if ((currentReturnType === incomingReturnType && currentReturnType === 'boolean') || isOnlyElement) {
    return incomingReturnType;
  } else if (booleanAndNull) {
    return 'boolean';
  }
  return 'invalid';
};

interface BaseElementList {
  id?: string;
  childInstances: Array<{
    returnType?: string;
    modifiers?: unknown[];
    childInstances?: BaseElementList['childInstances'];
  }>;
}

export const getListReturnType = (baseElementList: BaseElementList, isBooleanList: boolean | null = null): string => {
  const isBoolean = isBooleanList ?? isElementAndOr(baseElementList.id);

  let currentReturnType = isBoolean ? 'none' : 'list_of_any';

  // Set the initial type to the first child's type to start
  if (baseElementList.childInstances.length > 0) {
    const firstChild = baseElementList.childInstances[0];
    // Access returnType - use direct property access
    let firstChildReturnType = '';
    if (firstChild && typeof firstChild === 'object' && firstChild !== null) {
      const childRecord = firstChild as Record<string, unknown>;
      // Direct property access - check for undefined, null, or empty string
      const returnTypeValue = childRecord.returnType;
      if (returnTypeValue !== undefined && returnTypeValue !== null) {
        if (typeof returnTypeValue === 'string') {
          firstChildReturnType = returnTypeValue;
        }
      }
    }
    const firstChildModifiers =
      firstChild && typeof firstChild === 'object' && firstChild !== null && 'modifiers' in firstChild
        ? Array.isArray((firstChild as Record<string, unknown>).modifiers)
          ? ((firstChild as Record<string, unknown>).modifiers as Modifier[])
          : []
        : [];
    currentReturnType = getReturnType(firstChildReturnType, firstChildModifiers);
    if (!isBoolean) {
      currentReturnType = promoteReturnTypeToList(currentReturnType);
    }
  }

  baseElementList.childInstances.forEach(child => {
    // Access returnType - use direct property access
    let childReturnType = '';
    if (child && typeof child === 'object' && child !== null) {
      const childRecord = child as Record<string, unknown>;
      // Direct property access - check for undefined, null, or empty string
      const returnTypeValue = childRecord.returnType;
      if (returnTypeValue !== undefined && returnTypeValue !== null) {
        if (typeof returnTypeValue === 'string') {
          childReturnType = returnTypeValue;
        }
      }
    }
    const childModifiers =
      child && typeof child === 'object' && child !== null && 'modifiers' in child
        ? Array.isArray((child as Record<string, unknown>).modifiers)
          ? ((child as Record<string, unknown>).modifiers as Modifier[])
          : []
        : [];
    let incomingReturnType = getReturnType(childReturnType, childModifiers);
    // Base Element And/Or Lists can go multiple children deep so need recursion to check the type
    if (isBoolean && child.childInstances) {
      incomingReturnType = getListReturnType(child as BaseElementList, isBoolean);
    }
    const isOnlyElement = baseElementList.childInstances.length === 1;
    if (isBoolean) {
      currentReturnType = checkReturnTypeCompatibilityBooleanList(currentReturnType, incomingReturnType, isOnlyElement);
    } else {
      currentReturnType = checkReturnTypeCompatibilitySetList(currentReturnType, incomingReturnType);
    }
  });
  return currentReturnType;
};

export const calculateNewReturnType = (baseElement: BaseElementList, template: unknown, path = ''): string => {
  // Temporarily add the element to correctly calculate return type.
  const baseElementList = _.cloneDeep(baseElement);
  const target = findValueAtPath(baseElementList, path) as { childInstances?: unknown[] };
  if (target && target.childInstances) {
    target.childInstances.splice(target.childInstances.length, 0, template);
  }
  return getListReturnType(baseElementList);
};

interface ElementToAdd {
  instance: unknown;
  path: string;
  index?: number;
}

export const calculateReturnTypeAfterElementRemoved = (
  baseElement: BaseElementList,
  path = '',
  elementsToAdd: ElementToAdd[] = []
): string => {
  // Temporarily remove the element that will be deleted to correctly calculate return type.
  const indexToRemove = parseInt(path.slice(-1), 10);
  const baseElementList = _.cloneDeep(baseElement);
  const pathToParent = path.slice(0, path.length - 2); // Remove '.0' or '.1' etc
  const target = findValueAtPath(baseElementList, pathToParent);

  // target could be the array itself or an object with childInstances property
  let targetArray: unknown[] | undefined;
  if (Array.isArray(target)) {
    targetArray = target;
  } else if (target && typeof target === 'object' && target !== null && 'childInstances' in target) {
    targetArray = (target as { childInstances?: unknown[] }).childInstances;
  } else {
    // Fallback: try to get childInstances from baseElementList directly
    targetArray = baseElementList.childInstances;
  }

  if (targetArray) {
    targetArray.splice(indexToRemove, 1);
    // Temporarily add in any new elements being added (used for indenting/outdenting)
    if (elementsToAdd.length > 0) {
      elementsToAdd.forEach(addition => {
        // addition type: { instance: childInstance to add in, path: string, index: number }
        const targetToAdd = findValueAtPath(baseElementList, addition.path);
        let targetArrayToAdd: unknown[] | undefined;
        if (Array.isArray(targetToAdd)) {
          targetArrayToAdd = targetToAdd;
        } else if (
          targetToAdd &&
          typeof targetToAdd === 'object' &&
          targetToAdd !== null &&
          'childInstances' in targetToAdd
        ) {
          targetArrayToAdd = (targetToAdd as { childInstances?: unknown[] }).childInstances;
        }
        if (targetArrayToAdd) {
          const indexToAdd = addition.index !== undefined ? addition.index : targetArrayToAdd.length;
          targetArrayToAdd.splice(indexToAdd, 0, addition.instance);
        }
      });
    }
  }

  return getListReturnType(baseElementList);
};

export const calculateReturnTypeWithNewModifiers = (
  baseElement: BaseElementList,
  modifiers: unknown[],
  path = ''
): string => {
  // Temporarily apply the modifiers that will be updated. Base Element Lists can only be one child deep.
  const baseElementList = _.cloneDeep(baseElement);
  const target = findValueAtPath(baseElementList, path) as { modifiers?: unknown[] };
  if (target) {
    target.modifiers = modifiers;
  }

  return getListReturnType(baseElementList);
};

export const isBaseElementListUsed = (element: { usedBy?: unknown[] }): boolean =>
  element.usedBy ? element.usedBy.length !== 0 : false;

export const checkForNeedToPromote = (baseElementSetList: BaseElementList): void => {
  baseElementSetList.childInstances.forEach(child => {
    // Unions/Intersects only have children one level deep
    const childRecord = child as Record<string, unknown>;
    const childReturnTypeValue = (childRecord?.returnType as string | undefined) || '';
    const childModifiersValue = Array.isArray(childRecord?.modifiers) ? (childRecord.modifiers as Modifier[]) : [];
    let childReturnType = getReturnType(childReturnTypeValue, childModifiersValue);
    // All set lists will have a return type of list_of_SOMETHING. If any child on its own
    // has a singular return type, it needs to be promoted to a list in the CQL.
    if (!childReturnType.startsWith('list_of_') && baseElementSetList.childInstances.length > 1) {
      (child as { needToPromote?: boolean }).needToPromote = true;
    } else {
      (child as { needToPromote?: boolean }).needToPromote = false;
    }
  });
};
