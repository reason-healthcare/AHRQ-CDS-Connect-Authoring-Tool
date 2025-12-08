import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../store/hooks';
import { GroupElement } from './group-element';
import ConjunctionGroup from './ConjunctionGroup';
import { getFieldWithId } from 'utils/instances';
import {
  isElementAndOr,
  isBaseElementListUsed,
  calculateNewReturnType,
  calculateReturnTypeAfterElementRemoved,
  calculateReturnTypeWithNewModifiers
} from 'utils/lists';
import { getListGroupErrors, hasGroupNestedWarning } from 'utils/warnings';
import { getAllElements, getElementNames } from 'components/builder/utils';
import type { Instance } from '../../utils/instances';

interface ListGroupProps {
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
  deleteLists: () => void;
  editInstance: (
    treeName: string,
    editedFields: Array<Record<string, unknown>> | Record<string, unknown>,
    path: string,
    editingConjunctionType?: boolean,
    uid?: string | null
  ) => void;
  listInstance: Instance;
  updateInstanceModifiers: (
    treeName: string,
    modifiers: unknown[],
    path: string,
    uid?: string | null,
    updatedReturnType?: string | null,
    fhirVersion?: string | null
  ) => void;
  updateLists: (listInstance: Instance) => void;
}

const ListGroup: React.FC<ListGroupProps> = ({
  addInstance,
  deleteInstance,
  deleteLists,
  editInstance,
  listInstance,
  updateInstanceModifiers,
  updateLists
}) => {
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const allElements = getAllElements(artifact) ?? [];
  const instanceNames = getElementNames(allElements);
  const baseElements = artifact?.baseElements || [];
  const parameters = (artifact?.parameters || []).filter(({ name }) => name?.length);
  const isListInstanceUsed = isBaseElementListUsed(listInstance);
  const isAndOrElement = isElementAndOr(listInstance.id || '');
  const alerts = getListGroupErrors(listInstance, instanceNames, baseElements, parameters, allElements);
  const hasNestedWarning = hasGroupNestedWarning(
    listInstance.childInstances,
    instanceNames,
    baseElements,
    parameters,
    allElements,
    isAndOrElement
  );
  const hasErrors = alerts.filter(a => a.showAlert && a.alertSeverity === 'error').length > 0 || hasNestedWarning;

  const updateElement = (field: Record<string, unknown> | { id?: string; value?: unknown }): void => {
    // Field comes in as { id, name, type, value } from StringField
    // Or as { [fieldId]: value } from GroupElement's handleUpdateComment/handleUpdateTitleField
    // We need to extract the id and value to update the field
    const fieldId = (field as { id?: string }).id || Object.keys(field)[0];
    const value =
      (field as { value?: unknown }).value !== undefined ? (field as { value?: unknown }).value : field[fieldId];
    const fieldToUpdate = getFieldWithId(listInstance.fields, fieldId);
    if (fieldToUpdate) {
      (fieldToUpdate as { value?: unknown }).value = value;
      updateLists(listInstance);
    }
  };

  const addInstanceInGroup = (
    treeName: string,
    instance: Instance,
    parentPath: string,
    uid?: string | null,
    currentIndex?: number | null,
    incomingTree?: Instance | null,
    updatedReturnType?: string | null
  ): void => {
    const newReturnType =
      updatedReturnType ||
      calculateNewReturnType(
        listInstance as { id?: string; childInstances: Instance[] },
        instance as { id?: string; [key: string]: unknown },
        parentPath
      );
    addInstance(
      treeName,
      instance,
      parentPath,
      uid || listInstance.uniqueId || null,
      currentIndex,
      incomingTree,
      newReturnType
    );
  };

  const deleteInstanceInGroup = (
    treeName: string,
    path: string,
    toAdd: Array<{ instance: Instance; path: string; index?: number }> | null
  ): void => {
    const newReturnType = calculateReturnTypeAfterElementRemoved(
      listInstance as { id?: string; childInstances: Instance[] },
      path,
      toAdd
    );
    deleteInstance(treeName, path, toAdd, listInstance.uniqueId || null, newReturnType);
  };

  const editInstanceInGroup = (
    treeName: string,
    fields: Array<Record<string, unknown>> | Record<string, unknown>,
    path: string,
    editingConjunction: boolean
  ): void => {
    editInstance(treeName, fields, path, editingConjunction, listInstance.uniqueId || null);
  };

  const updateInstanceModifiersInGroup = (treeName: string, modifiers: unknown[], path: string): void => {
    const newReturnType = calculateReturnTypeWithNewModifiers(
      listInstance as { id?: string; childInstances: Instance[] },
      modifiers,
      path
    );
    updateInstanceModifiers(treeName, modifiers, path, listInstance.uniqueId || null, newReturnType);
  };

  return (
    <GroupElement
      alerts={alerts}
      disable={isListInstanceUsed}
      disableTitleField={false}
      groupInstance={listInstance}
      handleAddElement={() => {}} // Adding elements isn't handled by this wrapper GroupElement
      handleDeleteElement={deleteLists}
      handleUpdateElement={field => updateElement(field)}
      hasErrors={hasErrors}
      indentParity={'odd'}
      isWrapper
      label={'List Group'}
      showReturnType
      root={false}
    >
      <ConjunctionGroup
        addInstance={addInstanceInGroup}
        baseIndentLevel={1}
        deleteInstance={deleteInstanceInGroup}
        disableAddElement={isListInstanceUsed}
        disableIndent={!isAndOrElement}
        editInstance={editInstanceInGroup}
        elementUniqueId={listInstance.uniqueId || ''} // Ensures the current Base Element list isn't added to itself from ElementSelect
        instance={listInstance}
        options={isAndOrElement ? '' : 'listOperations'}
        root={true}
        treeName={'baseElements'}
        updateInstanceModifiers={updateInstanceModifiersInGroup}
        validateReturnType={isAndOrElement}
      />
    </GroupElement>
  );
};

export default ListGroup;
