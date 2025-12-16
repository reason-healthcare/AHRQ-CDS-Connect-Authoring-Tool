import _ from 'lodash';
import { getFieldWithType } from './instances';

interface ReferenceField {
  type?: string;
  id?: string;
  value?: { id?: string };
}

export function getOriginalBaseElement(
  instance: { fields?: ReferenceField[] },
  baseElements: Array<{ uniqueId?: string }>
): unknown {
  const referenceField = getFieldWithType(instance.fields || [], 'reference') as ReferenceField | undefined;
  if (referenceField) {
    if (referenceField.id === 'parameterReference' || referenceField.id === 'externalCqlReference') {
      return instance;
    }
    const baseElementReferenced = baseElements.find(element => element.uniqueId === referenceField.value?.id);
    if (baseElementReferenced) {
      return getOriginalBaseElement(baseElementReferenced as { fields?: ReferenceField[] }, baseElements);
    }
  }
  return instance;
}

export function getAllModifiersOnBaseElementUse(
  instance: { fields?: ReferenceField[]; modifiers?: unknown[] },
  baseElements: Array<{ uniqueId?: string; modifiers?: unknown[] }>,
  modifiers: unknown[] = []
): unknown[] {
  let currentModifiers = modifiers;
  const referenceField = getFieldWithType(instance.fields || [], 'reference') as ReferenceField | undefined;
  if (referenceField) {
    if (referenceField.id === 'parameterReference' || referenceField.id === 'externalCqlReference') {
      return _.cloneDeep(instance.modifiers || []).concat(currentModifiers);
    }
    const baseElementReferenced = baseElements.find(element => element.uniqueId === referenceField.value?.id);
    if (baseElementReferenced) {
      currentModifiers = _.cloneDeep((baseElementReferenced as { modifiers?: unknown[] }).modifiers || []).concat(
        currentModifiers
      );
      return getAllModifiersOnBaseElementUse(
        baseElementReferenced as { fields?: ReferenceField[]; modifiers?: unknown[] },
        baseElements,
        currentModifiers
      );
    }
  }
  return currentModifiers;
}

export function hasBaseElementLinks(
  instance: { uniqueId?: string },
  baseElements: Array<{ uniqueId?: string; usedBy?: unknown[] }>
): boolean {
  const thisBaseElement = baseElements.find(baseElement => baseElement.uniqueId === instance.uniqueId);
  if (!thisBaseElement) return false;
  const thisBaseElementUsedBy = thisBaseElement.usedBy;
  if (!thisBaseElementUsedBy || thisBaseElementUsedBy.length === 0) return false;
  return true;
}
