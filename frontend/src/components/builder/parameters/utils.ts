import { getFieldWithId } from 'utils/instances';
import { getEditorErrors } from 'components/builder/editors/utils';
import type { Parameter } from '../../../types/artifact';
import type { Instance } from '../../../utils/instances';

interface ElementName {
  name: string;
  id: string;
}

export const getParameterById = (parameters: Parameter[], id: string): Parameter | undefined =>
  parameters.find(param => param.uniqueId === id);

export const getParametersByType = (parameters: Parameter[], type: string): Parameter[] =>
  parameters.filter(param => param.type === type);

export const parameterHasDuplicateName = (parameter: Parameter, elementNames: ElementName[]): boolean => {
  const { name: parameterName, uniqueId, usedBy } = parameter;
  const duplicate = elementNames.find(({ name, id }) => name === parameterName && id !== uniqueId);
  return Boolean(duplicate && !usedBy?.includes(duplicate.id));
};

export const parameterHasChangedUse = (parameter: Parameter, allElements: Instance[]): boolean => {
  const { comment, usedBy } = parameter;
  return Boolean(
    usedBy?.some(usageId => {
      const use = allElements.find(({ uniqueId }) => uniqueId === usageId);
      if (!use) return false;
      const commentField = getFieldWithId(use.fields, 'comment');
      const commentValue =
        commentField && 'value' in commentField ? (commentField as { id?: string; value?: unknown }).value : undefined;
      const useComment = (typeof commentValue === 'string' ? commentValue : '') || '';
      return (use.modifiers?.length || 0) > 0 || useComment !== comment;
    })
  );
};

export const parametersHaveWarnings = (parameters: Parameter[], elementNames: ElementName[]): boolean => {
  for (const parameter of parameters) {
    const parameterValue = parameter.value;
    const editorValue: string | number | null | undefined =
      typeof parameterValue === 'object' && parameterValue !== null && 'value' in parameterValue
        ? (parameterValue.value as string | number | undefined)
        : (parameterValue as string | number | null | undefined);
    const editorErrors = getEditorErrors(parameter.type || '', editorValue);
    if (parameterHasDuplicateName(parameter, elementNames) || editorErrors.hasErrors) return true;
  }
  return false;
};
