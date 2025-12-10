import { v4 as uuidv4 } from 'uuid';
import pluralize from 'pluralize';
import _ from 'lodash';

import { getFieldWithId } from 'utils/instances';
import { sortAlphabeticallyByKey } from 'utils/sort';
import { changeToCase } from 'utils/strings';
import { isSupportedEditorType, getTypeByCqlArgument } from 'components/builder/editors/utils';
import type { Artifact, BaseElement } from 'types/artifact';
import type { Template, ExternalCqlLibrary } from 'types/query';
import type { Instance } from 'utils/instances';

interface VsacCode {
  display?: string;
  code?: string;
  codeSystem?: { name?: string; [key: string]: unknown };
  [key: string]: unknown;
}

interface VsacValueSet {
  name?: string;
  [key: string]: unknown;
}

interface GenerateElementParams {
  artifact: Artifact;
  cqlOption?: string;
  externalCqlList?: Array<
    ExternalCqlLibrary & {
      name?: string;
      details?: {
        definitions?: Array<{
          name?: string;
          calculatedReturnType?: string;
          operand?: Array<{ [key: string]: unknown }>;
          [key: string]: unknown;
        }>;
        functions?: Array<{
          name?: string;
          calculatedReturnType?: string;
          operand?: Array<{ [key: string]: unknown }>;
          argumentTypes?: Array<{ calculated?: string; [key: string]: unknown }>;
          [key: string]: unknown;
        }>;
        parameters?: Array<{
          name?: string;
          calculatedReturnType?: string;
          [key: string]: unknown;
        }>;
        [key: string]: unknown;
      };
    }
  >;
  option: string;
  subOption?: string;
  template: Template;
  vsacCode?: VsacCode;
  vsacValueSet?: VsacValueSet;
  vsacType?: 'codes' | 'valueSets';
}

interface GetElementEntriesParams {
  entryType: string;
  artifact: Artifact;
  elementTemplates: Template[];
  externalCqlList?: Array<
    ExternalCqlLibrary & {
      name?: string;
      _id?: string;
      details?: {
        definitions?: Array<{
          name?: string;
          calculatedReturnType?: string;
          operand?: Array<{ [key: string]: unknown }>;
          [key: string]: unknown;
        }>;
        functions?: Array<{
          name?: string;
          calculatedReturnType?: string;
          operand?: Array<{ [key: string]: unknown }>;
          argumentTypes?: Array<{ calculated?: string; [key: string]: unknown }>;
          [key: string]: unknown;
        }>;
        parameters?: Array<{
          name?: string;
          calculatedReturnType?: string;
          [key: string]: unknown;
        }>;
        dependencies?: Array<{ path?: string; version?: string; [key: string]: unknown }>;
        [key: string]: unknown;
      };
    }
  >;
  parentElementId?: string;
}

export const vsacCodeDisplayName = (vsacCode: VsacCode): string =>
  vsacCode.display && vsacCode.display.length < 60
    ? vsacCode.display
    : `${vsacCode.codeSystem?.name || ''} ${vsacCode.code || ''}`;

const getBaseElementReturnType = (baseElement: BaseElement): string | undefined => {
  if (baseElement.modifiers && baseElement.modifiers.length !== 0) {
    const lastModifier = _.last(baseElement.modifiers);
    return lastModifier?.returnType;
  }
  return baseElement.returnType;
};

const getDefinitions = (
  externalCqlLibrary: ExternalCqlLibrary & {
    details?: {
      definitions?: Array<{ calculatedReturnType?: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };
  }
): Array<{ calculatedReturnType?: string; [key: string]: unknown }> => {
  return externalCqlLibrary.details?.definitions || [];
};

const getZeroArgFunctions = (
  externalCqlLibrary: ExternalCqlLibrary & {
    details?: {
      functions?: Array<{
        argumentTypes?: Array<unknown>;
        calculatedReturnType?: string;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
  }
): Array<{ calculatedReturnType?: string; [key: string]: unknown }> => {
  return (
    externalCqlLibrary.details?.functions?.filter(func => {
      const argumentTypes = func.argumentTypes;
      return !argumentTypes || (Array.isArray(argumentTypes) && argumentTypes.length === 0);
    }) || []
  );
};

const isSupportedCqlFunction = (
  cqlFunction: {
    operand?: Array<unknown>;
    argumentTypes?: Array<{ calculated?: string; [key: string]: unknown }>;
    [key: string]: unknown;
  },
  baseElements: BaseElement[] = [],
  externalCqlList: Array<
    ExternalCqlLibrary & {
      details?: {
        definitions?: Array<{ calculatedReturnType?: string; [key: string]: unknown }>;
        functions?: Array<{ calculatedReturnType?: string; [key: string]: unknown }>;
        [key: string]: unknown;
      };
    }
  > = []
): boolean => {
  if (!cqlFunction.operand || cqlFunction.operand.length === 0 || !cqlFunction.argumentTypes) return true;

  return cqlFunction.argumentTypes.every(argType => {
    return (
      (argType.calculated && isSupportedEditorType(argType.calculated)) ||
      baseElements.some(baseElement => getBaseElementReturnType(baseElement) === argType.calculated) ||
      externalCqlList
        .map(lib => getDefinitions(lib))
        .flat()
        .some(def => def.calculatedReturnType === argType.calculated) ||
      externalCqlList
        .map(lib => getZeroArgFunctions(lib))
        .flat()
        .some(func => func.calculatedReturnType === argType.calculated)
    );
  });
};

export const generateElement = ({
  artifact,
  cqlOption,
  externalCqlList = [],
  option,
  subOption,
  template,
  vsacCode,
  vsacValueSet,
  vsacType
}: GenerateElementParams): Instance | undefined => {
  const { baseElements = [], parameters = [] } = artifact;

  switch (option) {
    case 'demographics':
    case 'listOperations':
    case 'medicationStatements':
    case 'medicationRequests':
      return _.cloneDeep(template.entries?.find(entry => entry.id === subOption)) as Instance;

    case 'baseElements': {
      const baseElement = baseElements.find(element => element.uniqueId === subOption);
      if (!baseElement) return undefined;
      const commentField = getFieldWithId(baseElement.fields || [], 'comment');
      const nameField = getFieldWithId(baseElement.fields || [], 'element_name');

      return {
        id: uuidv4(),
        name: 'Base Element',
        type: 'baseElement',
        template: 'GenericStatement',
        returnType: _.isEmpty(baseElement.modifiers)
          ? baseElement.returnType
          : _.last(baseElement.modifiers)?.returnType || baseElement.returnType,
        fields: [
          {
            id: 'element_name',
            type: 'string',
            name: 'Element Name',
            value: (nameField as { value?: string })?.value || ''
          },
          {
            id: 'baseElementReference',
            type: 'reference',
            name: 'reference',
            value: {
              id: baseElement.uniqueId || '',
              type: baseElement.type === 'parameter' ? baseElement.type : baseElement.name || ''
            },
            static: true
          },
          {
            id: 'comment',
            type: 'textarea',
            name: 'Comment',
            value: (commentField as { value?: string })?.value || ''
          }
        ]
      } as Instance;
    }

    case 'externalCql': {
      const cqlLibrary = externalCqlList.find(cqlLibrary => cqlLibrary._id === subOption);
      if (!cqlLibrary || !cqlLibrary.details) return undefined;
      const cqlLibraryDefinitions = (cqlLibrary.details.definitions || []).concat(cqlLibrary.details.parameters || []);
      const selectedCqlDefinition = cqlLibraryDefinitions.find(({ name }) => name === cqlOption);
      const cqlLibraryFunctions = (cqlLibrary.details.functions || []).filter(cqlFunction =>
        isSupportedCqlFunction(cqlFunction, baseElements, externalCqlList)
      );
      const selectedCqlFunction = cqlLibraryFunctions.find(({ name }) => name === cqlOption);
      const selectedCqlEntry = selectedCqlDefinition || selectedCqlFunction;
      if (!selectedCqlEntry) return undefined;
      const selectedCqlEntryType = selectedCqlDefinition ? 'GenericStatement' : 'GenericFunction';
      return {
        id: uuidv4(),
        name: 'External CQL Element',
        type: 'externalCqlElement',
        template: selectedCqlEntryType,
        returnType: selectedCqlEntry.calculatedReturnType,
        fields: [
          { id: 'element_name', type: 'string', name: 'Element Name', value: selectedCqlEntry.name || '' },
          {
            id: 'externalCqlReference',
            type: 'reference',
            name: 'reference',
            value: {
              id: `${selectedCqlEntry.name || ''}${selectedCqlEntryType === 'GenericFunction' ? ' (Function)' : ''} from ${cqlLibrary.name || ''}`,
              element: selectedCqlEntry.name,
              library: cqlLibrary.name,
              arguments: Array.isArray(selectedCqlEntry.operand)
                ? selectedCqlEntry.operand.map(operand => ({
                    ...operand,
                    value: { argSource: 'editor', type: getTypeByCqlArgument(operand) }
                  }))
                : undefined
            },
            static: true
          },
          { id: 'comment', type: 'textarea', name: 'Comment', value: '' }
        ]
      } as Instance;
    }

    case 'parameters': {
      const parameter = parameters.find(parameter => parameter.uniqueId === subOption);
      if (!parameter) return undefined;

      return {
        id: uuidv4(),
        name: parameter.name || '',
        type: 'parameter',
        returnType: parameter.type || '',
        template: 'GenericStatement',
        fields: [
          { id: 'element_name', type: 'string', name: 'Element Name', value: parameter.name || '' },
          { id: 'default', type: 'boolean', name: 'Default', value: parameter.value },
          {
            id: 'parameterReference',
            type: 'reference',
            name: 'reference',
            value: { id: parameter.uniqueId || '' },
            static: true
          },
          { id: 'comment', type: 'textarea', name: 'Comment', value: parameter.comment || '' }
        ]
      } as Instance;
    }

    default: {
      const templateEntryName = changeToCase(pluralize.singular(option), 'capitalCase');
      const element = _.cloneDeep(template.entries?.find(entry => entry.name === templateEntryName)) as Instance;
      if (!element) return undefined;
      const vsacCodeOrValueSet = _.cloneDeep(vsacType === 'valueSets' ? vsacValueSet : vsacCode);
      const valueName =
        vsacType === 'valueSets'
          ? (vsacCodeOrValueSet as VsacValueSet)?.name || ''
          : vsacCodeDisplayName(vsacCodeOrValueSet as VsacCode);
      element.type = 'element';
      if (element.fields && element.fields[0]) {
        element.fields[0] = {
          ...element.fields[0],
          static: true,
          [vsacType || 'codes']: [vsacCodeOrValueSet]
        };
      }
      const newFields = [
        { id: 'element_name', type: 'string', name: 'Element Name', value: valueName },
        { id: 'comment', type: 'textarea', name: 'Comment' }
      ];
      element.fields = newFields.concat((element.fields || []) as typeof newFields);
      return element;
    }
  }
};

export const getElementEntries = ({
  entryType,
  artifact,
  elementTemplates,
  externalCqlList = [],
  parentElementId
}: GetElementEntriesParams): Array<{
  value: string;
  label: string;
  options?: Array<{ value: string; label: string }>;
}> | null => {
  const { baseElements = [] } = artifact;
  switch (entryType) {
    case 'baseElements':
      return (
        artifact.baseElements
          ?.filter(baseElement => {
            const nameField = baseElement.fields?.find(field => field.id === 'element_name');
            return nameField?.value && baseElement.uniqueId !== parentElementId;
          })
          .map(baseElement => {
            const nameField = getFieldWithId(baseElement.fields || [], 'element_name');
            return {
              value: baseElement.uniqueId || '',
              label: ((nameField as { value?: string })?.value as string) || ''
            };
          }) || []
      );
    case 'demographics':
      const demographicsTemplate = elementTemplates.find(template => template.name === 'Demographics');
      return (
        demographicsTemplate?.entries?.map(entry => ({
          value: (entry.id as string) || '',
          label: entry.name || ''
        })) || []
      );
    case 'externalCql':
      if (!externalCqlList) return [];
      return externalCqlList.map(externalCql => {
        const cqlFunctions = (externalCql.details?.functions || [])
          .filter(cqlFunction => isSupportedCqlFunction(cqlFunction, baseElements, externalCqlList))
          .map(cqlFunction => ({
            value: cqlFunction.name || '',
            label: `${cqlFunction.name || ''} | Function(${Array.isArray(cqlFunction.operand) ? cqlFunction.operand.length : 0}) | ${cqlFunction.calculatedReturnType || ''}`
          }));
        const cqlDefinitions = (externalCql.details?.definitions || [])
          .concat(externalCql.details?.parameters || [])
          .map(cqlDefinition => ({
            value: cqlDefinition.name || '',
            label: `${cqlDefinition.name || ''} | ${cqlDefinition.calculatedReturnType || ''}`
          }));
        return {
          value: externalCql._id || '',
          label: externalCql.name || '',
          options: cqlFunctions.concat(cqlDefinitions).sort(sortAlphabeticallyByKey('label'))
        };
      });
    case 'parameters':
      return (
        artifact.parameters
          ?.filter(parameter => parameter.name)
          .map(parameter => ({
            value: parameter.uniqueId || '',
            label: (parameter.name as string) || ''
          })) || []
      );
    case 'listOperations':
      const operationsTemplate = elementTemplates.find(template => template.name === 'Operations');
      const operationsOptions =
        operationsTemplate?.entries?.map(entry => ({
          value: (entry.id as string) || '',
          label: entry.name || ''
        })) || [];
      const listOperationsTemplate = elementTemplates.find(template => template.name === 'List Operations');
      const listOperationsOptions =
        listOperationsTemplate?.entries?.map(entry => ({
          value: (entry.id as string) || '',
          label: entry.name || ''
        })) || [];
      return listOperationsOptions.concat(operationsOptions);
    case 'medicationStatements':
    case 'medicationRequests': {
      // Handle Medications template entries separately
      const medicationsTemplate = elementTemplates.find(template => template.name === 'Medications');
      if (!medicationsTemplate) return [];
      const entryName = entryType === 'medicationStatements' ? 'Medication Statement' : 'Medication Request';
      const entry = medicationsTemplate.entries?.find(e => e.name === entryName);
      return entry ? [{ value: (entry.id as string) || '', label: (entry.name as string) || '' }] : [];
    }
    default:
      return null;
  }
};
