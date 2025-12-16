import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import _ from 'lodash';
import { useQuery } from '@tanstack/react-query';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../store/hooks';

import fetchTemplates from 'queries/fetchTemplates';
import type { Template } from '../../types/query';
import Subpopulation from './Subpopulation';
import createTemplateInstance from 'utils/templates';
import { getSubpopulationErrors, hasGroupNestedWarning, isSubpopulationUsed } from 'utils/warnings';
import { getAllElements, getElementNames } from 'components/builder/utils';
import type { Instance } from '../../utils/instances';
import type { Subpopulation as SubpopulationType } from '../../types/artifact';

const TREE_NAME = 'subpopulations';

interface SubpopulationsProps {
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
  updateInstanceModifiers: (
    treeName: string,
    modifiers: unknown[],
    path: string,
    uid?: string | null,
    updatedReturnType?: string | null,
    fhirVersion?: string | null
  ) => void;
  updateSubpopulations: (subpopulations: unknown[], target?: string, updateFHIRVersion?: boolean) => void;
}

const Subpopulations: React.FC<SubpopulationsProps> = ({
  addInstance,
  deleteInstance,
  editInstance,
  updateInstanceModifiers,
  updateSubpopulations
}) => {
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { data: templates, isLoading: isTemplatesLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: () => fetchTemplates(),
    staleTime: Infinity
  });

  if (isTemplatesLoading || !artifact) {
    return <CircularProgress />;
  }

  const operations = templates?.find(g => g.name === 'Operations');
  const andTemplate = operations?.entries?.find(e => e.name === 'And');

  if (!andTemplate) {
    return <div>Error: Could not find And template</div>;
  }

  const { baseElements, recommendations, subpopulations } = artifact;
  const parameters = artifact.parameters?.filter(({ name }) => name?.length) || [];
  const numOfSpecialSubpopulations = subpopulations?.filter(s => s.special).length || 0;
  const allElements = getAllElements(artifact) ?? [];
  const instanceNames = getElementNames(allElements);

  const addSubpopulation = (): void => {
    const newSubpopulation = createTemplateInstance(andTemplate as Instance);
    (newSubpopulation as { name?: string }).name = '';
    (newSubpopulation as { path?: string }).path = '';
    (newSubpopulation as { subpopulationName?: string }).subpopulationName =
      `Subpopulation ${(subpopulations?.length || 0) - numOfSpecialSubpopulations + 1}`;
    (newSubpopulation as { expanded?: boolean }).expanded = true;
    const newSubpopulations = (subpopulations || []).concat([newSubpopulation as SubpopulationType]);

    updateSubpopulations(newSubpopulations, TREE_NAME);
  };

  const setSubpopulationName = (name: string, uniqueId: string | undefined): void => {
    const newSubpopulations = _.cloneDeep(subpopulations || []);
    const subpopulationIndex = newSubpopulations.findIndex(sp => sp.uniqueId === uniqueId);
    if (subpopulationIndex !== -1) {
      newSubpopulations[subpopulationIndex].subpopulationName = name;
    }

    updateSubpopulations(newSubpopulations, TREE_NAME);
  };

  const deleteSubpopulation = (uniqueId: string | undefined): void => {
    const newSubpopulations = _.cloneDeep(subpopulations || []);
    const subpopulationIndex = newSubpopulations.findIndex(sp => sp.uniqueId === uniqueId);
    if (subpopulationIndex !== -1) {
      newSubpopulations.splice(subpopulationIndex, 1);
    }

    // Update Subpopulations and update FHIRVersion because
    // elements that required a specific FHIR version may have been removed.
    // Because deleteInstance isn't called directly, we need to check here.
    updateSubpopulations(newSubpopulations, TREE_NAME, true);
  };

  return (
    <div className="subpopulations">
      {subpopulations
        ?.filter(s => !s.special)
        .map(subpopulation => {
          const subpopulationAlerts = getSubpopulationErrors(subpopulation, recommendations || [], instanceNames);
          const hasNestedWarning = hasGroupNestedWarning(
            subpopulation.childInstances,
            instanceNames,
            baseElements || [],
            parameters,
            allElements,
            true // validate
          );
          const hasErrors =
            subpopulationAlerts.filter(a => a.showAlert && a.alertSeverity === 'error').length > 0 || hasNestedWarning;
          return (
            <Subpopulation
              key={subpopulation.uniqueId}
              addInstance={(name: string, template: Instance, path: string) =>
                addInstance(name, template, path, subpopulation.uniqueId)
              } // Add elements inside subpopulations
              alerts={subpopulationAlerts}
              deleteInstance={(
                treeName: string,
                path: string,
                toAdd?: Array<{ instance: Instance; path: string; index?: number }> | null
              ) => deleteInstance(treeName, path, toAdd, subpopulation.uniqueId)} // Delete elements inside subpopulations
              disableDeleteSubpopulationElement={isSubpopulationUsed(recommendations || [], subpopulation.uniqueId)}
              editInstance={(
                treeName: string,
                fields: Array<Record<string, unknown>> | Record<string, unknown>,
                path: string,
                editingConjunction?: boolean
              ) => editInstance(treeName, fields, path, editingConjunction, subpopulation.uniqueId)} // Edit elements inside subpopulations
              handleDeleteSubpopulationElement={deleteSubpopulation}
              handleUpdateSubpopulationElement={(name: string, uniqueId: string) => {
                setSubpopulationName(name, uniqueId || undefined);
              }}
              hasErrors={hasErrors}
              subpopulation={subpopulation as Instance}
              subpopulationUniqueId={subpopulation.uniqueId}
              updateInstanceModifiers={updateInstanceModifiers}
            />
          );
        })}

      <Button color="primary" onClick={addSubpopulation} variant="contained">
        New subpopulation
      </Button>
    </div>
  );
};

export default Subpopulations;
