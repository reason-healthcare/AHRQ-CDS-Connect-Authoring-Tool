import type { BaseElement } from '../../../types/artifact';

export const getBaseElementReturnType = (baseElement: BaseElement): string | undefined =>
  baseElement.modifiers?.length > 0 ? baseElement.modifiers.slice(-1)[0].returnType : baseElement.returnType;

export const getBaseElementName = (baseElement: BaseElement | undefined): string | number | null | undefined => {
  if (!baseElement) return undefined;
  const nameField = baseElement.fields?.find(({ id }) => id === 'element_name');
  const value = nameField?.value;
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return undefined;
};

export const getBaseElementsByType = (baseElements: BaseElement[], type: string): BaseElement[] =>
  baseElements.filter(baseElement => getBaseElementReturnType(baseElement) === type);

export const getBaseElementById = (baseElements: BaseElement[], id: string): BaseElement | undefined =>
  baseElements.find(({ uniqueId }) => uniqueId === id);
