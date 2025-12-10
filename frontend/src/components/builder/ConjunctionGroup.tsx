import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../store/hooks';
import { CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import fetchTemplates from 'queries/fetchTemplates';
import { ArtifactElement } from 'components/builder/artifact-element';
import { GroupElement, ConjunctionTypeSelect } from 'components/builder/group-element';
import createTemplateInstance from 'utils/templates';
import { getElementErrors, hasDuplicateName, hasGroupNestedWarning, hasWarnings } from 'utils/warnings';
import { getLabelForInstance } from 'utils/instances';
import { getAllElements, getElementNames } from './utils';
import type { Instance } from '../../utils/instances';

interface ConjunctionGroupProps {
  addInstance: (
    treeName: string,
    instance: Instance,
    parentPath: string,
    uid?: string | null,
    currentIndex?: number | null,
    incomingTree?: Instance | null,
    updatedReturnType?: string | null
  ) => void;
  baseIndentLevel?: number;
  deleteInstance: (
    treeName: string,
    path: string,
    elementsToAdd?: Array<{ instance: Instance; path: string; index?: number }> | null,
    uid?: string | null,
    updatedReturnType?: string | null
  ) => void;
  disableAddElement?: boolean;
  disableIndent?: boolean;
  editInstance: (
    treeName: string,
    editedFields: Array<Record<string, unknown>> | Record<string, unknown>,
    path: string,
    editingConjunctionType?: boolean,
    uid?: string | null
  ) => void;
  elementUniqueId?: string;
  getPath?: (id: string | undefined) => string;
  instance: Instance;
  options?: string;
  root: boolean;
  subpopulationUniqueId?: string;
  treeName: string;
  updateInstanceModifiers: (
    treeName: string,
    modifiers: unknown[],
    path: string,
    uid?: string | null,
    updatedReturnType?: string | null,
    fhirVersion?: string | null
  ) => void;
  validateReturnType?: boolean;
}

const ConjunctionGroup: React.FC<ConjunctionGroupProps> = ({
  addInstance,
  baseIndentLevel,
  deleteInstance,
  disableAddElement,
  disableIndent,
  editInstance,
  elementUniqueId,
  getPath: getPathOfParent,
  instance,
  options,
  root,
  subpopulationUniqueId,
  treeName,
  updateInstanceModifiers,
  validateReturnType
}) => {
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { data: templates, isPending: isTemplatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => fetchTemplates(),
    staleTime: Infinity
  });

  if (isTemplatesLoading || !artifact) {
    return <CircularProgress />;
  }

  const baseElements = artifact.baseElements || [];
  const allElements = getAllElements(artifact) ?? [];
  const instanceNames = getElementNames(allElements);
  const parameters = (artifact.parameters || []).filter(({ name }) => name?.length);

  const conjunctionGroupOptions = templates?.find(t => t.name === 'Operations')?.entries ?? [];
  const listOperationOptions = templates?.find(t => t.name === 'List Operations')?.entries ?? [];
  const selectOptions = options === 'listOperations' ? listOperationOptions : (conjunctionGroupOptions ?? []);
  const hasDuplicateNameWarning = hasDuplicateName(instance, instanceNames, baseElements, parameters, allElements);
  const hasNestedWarning = hasGroupNestedWarning(
    instance.childInstances,
    instanceNames,
    baseElements,
    parameters,
    allElements,
    validateReturnType || false
  );

  // if root component, returns root artifact path, otherwise calls child's getPath function with artifact id
  const getPath = (): string => {
    if (root) {
      return instance.path || '';
    }
    if (getPathOfParent) {
      return getPathOfParent(instance.uniqueId || '');
    }
    return '';
  };

  const getChildsPath = (id: string): string => {
    const artifactTree = instance;
    const childIndex = (artifactTree.childInstances || []).findIndex(inst => inst.uniqueId === id);
    return `${getPath()}.childInstances.${childIndex}`;
  };

  const getIndentParity = (path: string): string => {
    const level = path.split('.').filter(pathSection => pathSection === 'childInstances').length;
    if (level % 2 === (baseIndentLevel ?? 0)) {
      return 'even';
    }
    return 'odd';
  };

  const indentClickHandler = (element: Instance): void => {
    if (disableAddElement) {
      return;
    }

    // Decide what type of conjunction group to create when indenting
    let conjunctionType: { id?: string; name?: string; [key: string]: unknown } | undefined;
    if (instance.name === 'Or') {
      conjunctionType = conjunctionGroupOptions.find(template => template.id === 'And');
    } else {
      // Default is adding an OR
      conjunctionType = conjunctionGroupOptions.find(template => template.id === 'Or');
    }

    if (element.conjunction && conjunctionType) {
      // Indenting a conjunction group (and it's children)
      const newInstance = createTemplateInstance(conjunctionType, [element]) as Instance;
      const parentPath = getPath().split('.').slice(0, -2).join('.'); // Path of parent of conjunction group
      const index = Number(getPath().split('.').pop()); // Index of to indent group at
      const toAdd = [{ instance: newInstance, path: parentPath, index }];

      deleteInstance(treeName, getPath(), toAdd);
    } else if (conjunctionType) {
      // Indent a single templateInstance
      const newInstance = createTemplateInstance(conjunctionType, [element]) as Instance;
      const index = Number(
        getChildsPath(element.uniqueId || '')
          .split('.')
          .pop()
      ); // Index to add new conjunction at
      const toAdd = [{ instance: newInstance, path: getPath(), index }];

      deleteInstance(treeName, getChildsPath(element.uniqueId || ''), toAdd);
    }
  };

  const outdentClickHandler = (element: Instance): void => {
    if (disableAddElement) {
      return;
    }
    if (element.conjunction) {
      // Outdenting a conjunction group. Removes the conjunction, readds each child to the conjunction's parent
      const toAdd = (element.childInstances || []).map((child, i) => {
        // Path of the parent where items get added
        const parentPath = getPath().split('.').slice(0, -2).join('.');
        const indexStr = getPath().split('.').pop() || '0';
        const index = Number(indexStr) + i; // Index to add the conjunction's children at
        return { instance: child, path: parentPath, index };
      });

      deleteInstance(treeName, getPath(), toAdd);
    } else {
      // Outdenting a single templateInstance
      // Path of the parent of the group instance is coming from. This is where it will be readded
      const parentPath = getPath().split('.').slice(0, -2).join('.');
      const indexStr = getPath().split('.').pop() || '0';
      const index = Number(indexStr) + 1; // Readd the child that is being outdented right below the parent it came from
      const toAdd = [{ instance: element, path: parentPath, index }];
      deleteInstance(treeName, getChildsPath(element.uniqueId || ''), toAdd);
    }
  };

  const renderArtifactElement = (instance: Instance, group: Instance): React.ReactElement => (
    <div key={instance.uniqueId} className="card-group-section" id={instance.uniqueId}>
      <ArtifactElement
        alerts={getElementErrors(instance, allElements, baseElements, instanceNames, parameters)}
        allowIndent={!disableIndent}
        allowOutdent={getPath() !== ''} // cannot outdent if at the root
        baseElementInUsedList={!!disableAddElement}
        elementInstance={instance}
        handleDeleteElement={() => deleteInstance(treeName, getChildsPath(instance.uniqueId || ''))}
        handleIndent={() => indentClickHandler(instance)}
        handleOutdent={() => outdentClickHandler(instance)}
        handleUpdateElement={newElementField =>
          editInstance(treeName, newElementField, getChildsPath(instance.uniqueId || ''), false)
        }
        hasErrors={hasWarnings(
          instance,
          instanceNames,
          baseElements,
          parameters,
          allElements,
          validateReturnType || false
        )}
        indentParity={getIndentParity(getChildsPath(instance.uniqueId || ''))}
        label={getLabelForInstance(instance, baseElements)}
        updateModifiers={(modifiers, fhirVersion) =>
          updateInstanceModifiers(
            treeName,
            modifiers,
            getChildsPath(instance.uniqueId || ''),
            subpopulationUniqueId || null,
            null,
            fhirVersion
          )
        }
        validateReturnType={validateReturnType || false}
      />

      <ConjunctionTypeSelect
        editInstance={type => editInstance(treeName, type, getPath(), true)}
        name={group.name}
        options={
          selectOptions as Array<{
            id: string;
            name: string;
            suppress?: boolean;
            [key: string]: string | number | boolean | undefined;
          }>
        }
      />
    </div>
  );

  const renderChildren = (): React.ReactElement[] =>
    (instance.childInstances || []).map(child => {
      // return null if child instance conjunction is false
      if (child.conjunction) {
        return (
          <div key={child.uniqueId} className="card-group">
            <ConjunctionGroup
              addInstance={addInstance}
              baseIndentLevel={baseIndentLevel}
              deleteInstance={deleteInstance}
              disableAddElement={disableAddElement}
              editInstance={editInstance}
              elementUniqueId={elementUniqueId}
              getPath={getChildsPath}
              instance={child}
              root={false}
              subpopulationUniqueId={subpopulationUniqueId}
              treeName={treeName}
              updateInstanceModifiers={updateInstanceModifiers}
              validateReturnType={validateReturnType}
            />

            <ConjunctionTypeSelect
              editInstance={type => editInstance(treeName, type, getPath(), true)}
              name={instance.name}
              options={
                selectOptions as Array<{
                  id: string;
                  name: string;
                  suppress?: boolean;
                  [key: string]: string | number | boolean | undefined;
                }>
              }
            />
          </div>
        );
      }

      return renderArtifactElement(child, instance);
    });

  return (
    <GroupElement
      alerts={getElementErrors(instance, [], [], instanceNames, [])} // We know the conjunction group isn't a parameter or baseElement, so we can pass in empty arrays
      allowIndent={true}
      allowOutdent={getPath() !== ''}
      disable={!!disableAddElement}
      elementUniqueId={elementUniqueId}
      groupInstance={instance}
      handleAddElement={template =>
        addInstance(
          treeName,
          createTemplateInstance(template as { id?: string; [key: string]: unknown }) as Instance,
          getPath()
        )
      }
      handleDeleteElement={() => deleteInstance(treeName, getPath())}
      handleIndent={() => indentClickHandler(instance)}
      handleOutdent={() => outdentClickHandler(instance)}
      handleUpdateElement={newElementField =>
        editInstance(
          treeName,
          Array.isArray(newElementField) ? newElementField : newElementField,
          getPath(),
          false
        )
      }
      hasErrors={hasDuplicateNameWarning || hasNestedWarning}
      indentParity={getIndentParity(getPath())}
      root={root}
    >
      {renderChildren()}
    </GroupElement>
  );
};

export default ConjunctionGroup;
