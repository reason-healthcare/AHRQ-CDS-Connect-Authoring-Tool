import React from 'react';
import { Alert } from '@mui/material';
import _ from 'lodash';
import { useAppSelector } from '../../../store/hooks';

import { hasBaseElementLinks } from 'utils/baseElements';
import { hasReturnTypeError, validateElement } from 'utils/warnings';
import {
  getFieldWithId,
  getFieldWithType,
  getInstanceById,
  getInstanceByReference,
  getReferenceArguments,
  getReturnType
} from 'utils/instances';
import { getAllElements, getElementNames } from 'components/builder/utils';
import ExpressionPhrase from 'components/builder/ExpressionPhrase';
import {
  CodeListTemplate,
  ExternalCqlTemplate,
  FieldsTemplate,
  ModifiersTemplate,
  ReferenceTemplate,
  ReturnTypeTemplate,
  ValueSetListTemplate
} from 'components/builder/templates';
import type { Instance, Modifier } from '../../../utils/instances';
import type { Artifact } from '../../../types/artifact';
import type { Field } from '../../../types/artifact';

interface ValueSet {
  name: string;
  oid: string;
  [key: string]: unknown;
}

interface CodeData {
  code: string;
  codeSystem: { name: string; [key: string]: unknown };
  [key: string]: unknown;
}

interface ArtifactElementBodyProps {
  baseElementIsUsed: boolean;
  elementInstance: Instance;
  handleUpdateElement: (newElementField: Record<string, unknown>) => void;
  updateModifiers: (modifiers: Modifier[], fhirVersion?: string | null) => void;
  validateReturnType?: boolean;
}

const ArtifactElementBody: React.FC<ArtifactElementBodyProps> = ({
  baseElementIsUsed,
  elementInstance,
  handleUpdateElement,
  updateModifiers,
  validateReturnType
}) => {
  const artifact = useAppSelector(state => state.artifacts.artifact) as Artifact | null;
  const { baseElements } = artifact || { baseElements: [] };
  const { fields, modifiers, returnType: startingReturnType } = elementInstance;
  const fieldsToRender = ['number', 'string', 'textarea', 'valueset'];
  const externalCqlField = getFieldWithId(fields, 'externalCqlReference') as Field | undefined;
  const vsacField = getFieldWithType(fields, '_vsac') as Field | undefined;
  const referenceField = getFieldWithType(fields, 'reference') as Field | undefined;
  const allElements = getAllElements(artifact) ?? [];
  const instanceNames = getElementNames(allElements);

  const validationError = validateElement(elementInstance);
  const returnTypeError = hasReturnTypeError(
    getReturnType(startingReturnType, modifiers),
    modifiers,
    'boolean',
    validateReturnType
  )
    ? "Element must have return type 'boolean' (true/false). Add expression(s) to change the return type."
    : null;

  const handleDeleteValueSet = (valueSetToDelete: ValueSet): void => {
    const elementInstanceClone = _.cloneDeep(elementInstance);
    const cloneVsacField = getFieldWithType(elementInstanceClone.fields, '_vsac') as Field | undefined;
    if (cloneVsacField && cloneVsacField.valueSets) {
      const updatedValueSets = cloneVsacField.valueSets as ValueSet[];
      const indexOfVSToRemove = updatedValueSets.findIndex(
        vs => vs.name === valueSetToDelete.name && vs.oid === valueSetToDelete.oid
      );
      updatedValueSets.splice(indexOfVSToRemove, 1);
      const arrayToUpdate: Array<Record<string, unknown>> = [
        { [cloneVsacField.id]: updatedValueSets, attributeToEdit: 'valueSets' }
      ];
      handleUpdateElement(arrayToUpdate);
    }
  };

  const handleDeleteCode = (codeToDelete: CodeData): void => {
    const elementInstanceClone = _.cloneDeep(elementInstance);
    const cloneVsacField = getFieldWithType(elementInstanceClone.fields, '_vsac') as Field | undefined;
    if (cloneVsacField && cloneVsacField.codes) {
      const updatedCodes = [...(cloneVsacField.codes as CodeData[])];
      const indexOfCodeToRemove = updatedCodes.findIndex(
        code => code.code === codeToDelete.code && _.isEqual(code.codeSystem, codeToDelete.codeSystem)
      );
      updatedCodes.splice(indexOfCodeToRemove, 1);
      const arrayToUpdate: Array<Record<string, unknown>> = [
        { [cloneVsacField.id]: updatedCodes, attributeToEdit: 'codes' }
      ];
      handleUpdateElement(arrayToUpdate);
    }
  };

  const handleRemoveModifier = (index: number): void => {
    const newModifiers = _.cloneDeep(elementInstance.modifiers) as Modifier[];
    if (index > -1 && newModifiers) newModifiers.splice(index, 1);
    updateModifiers(newModifiers || []);
  };

  const handleUpdateModifier = (index: number, values: Modifier[]): void => {
    const newModifiers = _.cloneDeep(elementInstance.modifiers) as Modifier[];
    if (values[0]?.where) {
      if (newModifiers) newModifiers[index] = values[0];
    } else if (newModifiers && newModifiers[index]) {
      newModifiers[index].values = { ...newModifiers[index].values, ...values };
    }
    updateModifiers(newModifiers || []);
  };

  return (
    <>
      {validationError && <Alert severity={'error'}>{validationError}</Alert>}
      {returnTypeError && <Alert severity={'error'}>{returnTypeError}</Alert>}

      <ExpressionPhrase instance={elementInstance} baseElements={baseElements || []} />

      {elementInstance.fields && elementInstance.fields.length > 2 && elementInstance.type !== 'externalCqlElement' && (
        <FieldsTemplate
          fields={elementInstance.fields.filter(
            field => fieldsToRender.includes(field.type || '') && field.id !== 'comment' && field.id !== 'element_name'
          )}
          handleUpdateField={handleUpdateElement}
        />
      )}

      {elementInstance.fields &&
        elementInstance.fields.length > 2 &&
        elementInstance.type === 'externalCqlElement' &&
        externalCqlField &&
        externalCqlField.value &&
        typeof externalCqlField.value === 'object' &&
        'arguments' in externalCqlField.value && (
          <ExternalCqlTemplate
            externalCqlArguments={(externalCqlField.value.arguments as unknown[]) || []}
            handleUpdateExternalCqlArguments={args => {
              handleUpdateElement({
                externalCqlReference: { ...externalCqlField.value, arguments: args }
              });
            }}
          />
        )}

      {elementInstance.id?.includes('_vsac') && elementInstance.fields && elementInstance.fields.length > 1 && (
        <>
          <ValueSetListTemplate
            handleDeleteValueSet={handleDeleteValueSet}
            valueSets={(vsacField?.valueSets as ValueSet[]) || []}
          />

          <CodeListTemplate handleDeleteCode={handleDeleteCode} codes={(vsacField?.codes as CodeData[]) || []} />
        </>
      )}

      {referenceField?.id === 'externalCqlReference' &&
        referenceField.value &&
        typeof referenceField.value === 'object' &&
        'arguments' in referenceField.value &&
        [...getReferenceArguments(referenceField.value.arguments as unknown[])].map((arg, index) => (
          <ReferenceTemplate
            key={index}
            elementNames={instanceNames}
            referenceInstanceTab={getInstanceByReference(allElements, referenceField).tab}
            referenceField={{
              id: arg.value.argSource === 'baseElement' ? 'baseElementArgumentReference' : 'parameterArgumentReference',
              value: { id: arg.value?.selected, elementName: arg.value?.elementName }
            }}
          />
        ))}

      {referenceField && (
        <ReferenceTemplate
          elementNames={instanceNames}
          referenceInstanceTab={getInstanceByReference(allElements, referenceField).tab}
          referenceField={referenceField}
        />
      )}

      {hasBaseElementLinks(elementInstance, baseElements || []) &&
        baseElements &&
        [...new Set(baseElements.find(baseElement => baseElement.uniqueId === elementInstance.uniqueId)?.usedBy || [])].map(
          (link, index) => (
            <ReferenceTemplate
              key={`standalone-${link}-${index}`}
              elementNames={instanceNames}
              referenceInstanceTab={getInstanceById(allElements, link).tab}
              referenceField={{ id: 'baseElementUse', value: { id: link } }}
            />
          )
        )}

      {elementInstance.modifiers && elementInstance.modifiers.length > 0 && (
        <ModifiersTemplate
          baseElementIsUsed={baseElementIsUsed}
          elementInstance={elementInstance}
          handleRemoveModifier={handleRemoveModifier}
          handleUpdateModifier={handleUpdateModifier}
        />
      )}

      <ReturnTypeTemplate
        returnType={_.startCase(getReturnType(startingReturnType, modifiers))}
        returnTypeIsValid={validateReturnType !== false && getReturnType(startingReturnType, modifiers) === 'boolean'}
      />
    </>
  );
};

export default ArtifactElementBody;

