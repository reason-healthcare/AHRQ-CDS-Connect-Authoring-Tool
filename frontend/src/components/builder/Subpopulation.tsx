import React from 'react';
import { GroupElement } from './group-element';
import ConjunctionGroup from './ConjunctionGroup';
import type { Instance } from '../../utils/instances';
import type { Alert } from '../../utils/warnings';

interface SubpopulationProps {
  addInstance: (
    treeName: string,
    instance: Instance,
    parentPath: string,
    uid?: string | null,
    currentIndex?: number | null,
    incomingTree?: Instance | null,
    updatedReturnType?: string | null
  ) => void;
  alerts?: Alert[];
  deleteInstance: (
    treeName: string,
    path: string,
    elementsToAdd?: Array<{ instance: Instance; path: string; index?: number }> | null,
    uid?: string | null,
    updatedReturnType?: string | null
  ) => void;
  disableDeleteSubpopulationElement: boolean;
  editInstance: (
    treeName: string,
    editedFields: Array<Record<string, unknown>> | Record<string, unknown>,
    path: string,
    editingConjunctionType?: boolean,
    uid?: string | null
  ) => void;
  handleDeleteSubpopulationElement: (uniqueId: string) => void;
  handleUpdateSubpopulationElement: (name: string, uniqueId: string) => void;
  hasErrors: boolean;
  subpopulation: Instance;
  subpopulationUniqueId: string;
  updateInstanceModifiers: (
    treeName: string,
    modifiers: unknown[],
    path: string,
    uid?: string | null,
    updatedReturnType?: string | null,
    fhirVersion?: string | null
  ) => void;
}

const Subpopulation: React.FC<SubpopulationProps> = ({
  addInstance,
  alerts,
  deleteInstance,
  disableDeleteSubpopulationElement,
  editInstance,
  handleDeleteSubpopulationElement,
  handleUpdateSubpopulationElement,
  hasErrors,
  subpopulation,
  subpopulationUniqueId,
  updateInstanceModifiers
}) => {
  return (
    <GroupElement
      alerts={alerts}
      allowComment={false}
      disable={disableDeleteSubpopulationElement}
      disableTitleField={disableDeleteSubpopulationElement}
      groupInstance={subpopulation}
      groupTitleField={{
        id: 'subpopulation_title',
        value: (subpopulation as { subpopulationName?: string }).subpopulationName as string
      }}
      handleAddElement={() => {}} // Adding elements isn't handled by this wrapper GroupElement
      handleDeleteElement={() => handleDeleteSubpopulationElement(subpopulation.uniqueId)}
      handleUpdateElement={field => {
        // GroupElement passes { [fieldId]: value }, extract the value for subpopulation_title
        const fieldValue = (field as { subpopulation_title?: string }).subpopulation_title || '';
        handleUpdateSubpopulationElement(fieldValue, subpopulation.uniqueId);
      }}
      hasErrors={hasErrors}
      label={'Subpopulation'}
      indentParity={'odd'}
      isWrapper
      root={false}
    >
      <ConjunctionGroup
        addInstance={addInstance}
        baseIndentLevel={1}
        deleteInstance={deleteInstance}
        editInstance={editInstance}
        instance={subpopulation}
        root={true}
        subpopulationUniqueId={subpopulationUniqueId}
        treeName={'subpopulations'}
        updateInstanceModifiers={updateInstanceModifiers}
      />
    </GroupElement>
  );
};

export default Subpopulation;
