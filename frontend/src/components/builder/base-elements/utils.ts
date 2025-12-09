import type { BaseElement } from '../../../types/artifact';

export const getBaseElementReturnType = (baseElement: BaseElement): string | undefined =>
  (baseElement.modifiers?.length || 0) > 0
    ? baseElement.modifiers[baseElement.modifiers.length - 1]?.returnType
    : baseElement.returnType;

export const getBaseElementName = (baseElement: BaseElement): string | number | null | undefined => {
  const nameField = baseElement.fields?.find(({ id }) => id === 'element_name');
  return nameField?.value;
};

export const getBaseElementsByType = (baseElements: BaseElement[], type: string): BaseElement[] =>
  baseElements.filter(baseElement => getBaseElementReturnType(baseElement) === type);

export const getBaseElementById = (baseElements: BaseElement[], id: string): BaseElement | undefined =>
  baseElements.find(({ uniqueId }) => uniqueId === id);
