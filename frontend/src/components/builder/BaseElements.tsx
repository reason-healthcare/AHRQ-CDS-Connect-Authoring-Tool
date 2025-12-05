import React from 'react';
import _ from 'lodash';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../store/hooks';

import ListGroup from 'components/builder/ListGroup';
import { ArtifactElement } from 'components/builder/artifact-element';
import { ElementSelect } from 'components/builder/element-select';
import { getLabelForInstance, getFieldWithId } from 'utils/instances';
import createTemplateInstance from 'utils/templates';
import { getElementErrors, hasWarnings } from 'utils/warnings';
import { getAllElements, getElementNames } from 'components/builder/utils';
import type { Instance } from '../../utils/instances';
import type { Template } from '../../types/query';

interface BaseElementsProps {
  addBaseElement: (instance: Instance, uid?: string | null, incomingTree?: Instance[] | null) => void;
  addInstance: (
    treeName: string,
    instance: Instance,
    parentPath: string,
    uid?: string | null,
    currentIndex?: number | null,
    incomingTree?: Instance | null,
    updatedReturnType?: string | null
  ) => void;
  deleteInstance: (
    treeName: string,
    path: string,
    elementsToAdd?: Array<{ instance: Instance; path: string; index?: number }> | null,
    uid?: string | null,
    updatedReturnType?: string | null
  ) => void;
  editInstance: (
    treeName: string,
    editedFields: Array<Record<string, unknown>> | Record<string, unknown>,
    path: string,
    editingConjunctionType?: boolean,
    uid?: string | null
  ) => void;
  updateBaseElementLists: (newBaseElements: Instance[], target?: string, updateFHIRVersion?: boolean) => void;
  updateInstanceModifiers: (
    treeName: string,
    modifiers: unknown[],
    path: string,
    uid?: string | null,
    updatedReturnType?: string | null,
    fhirVersion?: string | null
  ) => void;
  validateReturnType: boolean;
}

const BaseElements: React.FC<BaseElementsProps> = ({
  addBaseElement,
  addInstance,
  deleteInstance,
  editInstance,
  updateBaseElementLists,
  updateInstanceModifiers,
  validateReturnType
}) => {
  const artifact = useAppSelector(state => state.artifacts.artifact);
  if (!artifact) return null;

  const { baseElements } = artifact;
  const parameters = artifact.parameters?.filter(({ name }) => name?.length) || [];
  const allElements = getAllElements(artifact) ?? [];
  const instanceNames = getElementNames(allElements);

  const getChildsPath = (id: string | undefined): string => {
    const childIndex = baseElements?.findIndex(instance => instance.uniqueId === id) ?? -1;
    return `${childIndex}`;
  };

  const addElement = (template: Template): void => {
    const instance = createTemplateInstance(template as Instance);
    (instance as { path?: string }).path = '';
    if (instance.conjunction) {
      const nameField = getFieldWithId((instance as Instance).fields, 'element_name');
      if (nameField) {
        (nameField as { value?: string }).value = `Base Element ${(baseElements?.length || 0) + 1}`;
      }
    }
    addBaseElement(instance);
  };

  const updateBaseElements = (newBaseElement: Instance, index: number): void => {
    const baseElementsCopy = _.cloneDeep(baseElements || []);
    baseElementsCopy[index] = newBaseElement;
    updateBaseElementLists(baseElementsCopy, 'baseElements');
  };

  const deleteBaseElements = (index: number): void => {
    const baseElementsCopy = _.cloneDeep(baseElements || []);
    baseElementsCopy.splice(index, 1);

    // Update Base Elements and update FHIRVersion because
    // elements that required a specific FHIR version may have been removed.
    // Because deleteInstance isn't called directly, we need to check here.
    updateBaseElementLists(baseElementsCopy, 'baseElements', true);
  };

  return (
    <>
      {baseElements?.map((baseElement, i) => {
        if (baseElement.conjunction) {
          return (
            <div key={baseElement.uniqueId} id={baseElement.uniqueId}>
              <ListGroup
                addInstance={addInstance}
                deleteInstance={deleteInstance}
                deleteLists={() => deleteBaseElements(i)}
                editInstance={editInstance}
                listInstance={baseElement}
                updateLists={(baseElement: Instance) => updateBaseElements(baseElement, i)}
                updateInstanceModifiers={updateInstanceModifiers}
              />
            </div>
          );
        }
        return (
          <div key={baseElement.uniqueId} id={baseElement.uniqueId}>
            <ArtifactElement
              alerts={getElementErrors(baseElement, allElements, baseElements || [], instanceNames, parameters)}
              allowIndent={false}
              baseElementInUsedList={false} // Since this is not a list, this prop is always false
              elementInstance={baseElement}
              handleDeleteElement={() => deleteInstance('baseElements', getChildsPath(baseElement.uniqueId))}
              handleUpdateElement={(newElementField: Record<string, unknown>) =>
                editInstance('baseElements', newElementField, getChildsPath(baseElement.uniqueId), false)
              }
              hasErrors={hasWarnings(
                baseElement,
                instanceNames,
                baseElements || [],
                parameters,
                allElements,
                validateReturnType
              )}
              label={getLabelForInstance(baseElement, baseElements || [])}
              updateModifiers={(modifiers: unknown[], fhirVersion?: string | null) =>
                updateInstanceModifiers(
                  'baseElements',
                  modifiers,
                  getChildsPath(baseElement.uniqueId),
                  null,
                  null,
                  fhirVersion
                )
              }
              validateReturnType={validateReturnType}
            />
          </div>
        );
      })}
      <ElementSelect handleAddElement={addElement} />
    </>
  );
};

export default BaseElements;
