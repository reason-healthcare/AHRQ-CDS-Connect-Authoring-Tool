import React, { useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon, MenuBook as MenuBookIcon } from '@mui/icons-material';

// eslint-disable-next-line import/no-unresolved
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

import { updateArtifact } from 'actions/artifacts';
import { setActiveTab } from 'actions/navigation';
import { Summary } from 'components/builder/summary';
import ConjunctionGroup from 'components/builder/ConjunctionGroup';
import Subpopulations from 'components/builder/Subpopulations';
import BaseElements from 'components/builder/BaseElements';
import { Recommendations } from 'components/builder/recommendations';
import { Parameters } from 'components/builder/parameters';
import { ErrorStatement } from 'components/builder/error-statement';
import { ExternalCql } from 'components/builder/external-cql';
import WorkspaceBlurb from './WorkspaceBlurb';
import { blurbs } from './blurbs';
import { getTabMetadata } from './tabUtils';
import { getFHIRVersion, getTree } from 'components/builder/utils';
import { findValueAtPath } from 'utils/find';
import type { Artifact, ExpressionTree, Subpopulation, Recommendation } from '../../../types/artifact';
import type { ExternalCqlLibrary } from '../../../types/query';
import type { Instance, Modifier } from '../../../utils/instances';
import { useSpacingStyles } from 'styles/hooks';
import useStyles from './styles';

interface WorkspaceTabsProps {
  externalCqlList: ExternalCqlLibrary[];
  handleSaveArtifact: (artifact: Artifact | null, artifactProps: Partial<Artifact>) => void;
}

interface TabIconProps {
  hasContent: boolean;
  hasError: boolean;
}

const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({ externalCqlList, handleSaveArtifact }) => {
  const spacingStyles = useSpacingStyles();
  const styles = useStyles();
  const [tabMetadata, setTabMetadata] = useState<Record<string, { hasContent: boolean; hasError: boolean }>>({});
  const activeTab = useAppSelector(state => state.navigation.activeTab);
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const dispatch = useAppDispatch();
  const handleUpdateArtifact = (a: Artifact | null, artifactProps: Partial<Artifact>): void => {
    dispatch(updateArtifact(a, artifactProps));
  };

  useEffect(() => {
    if (artifact) {
      const metadata = getTabMetadata(artifact, externalCqlList.length);
      setTabMetadata(metadata);
    }
  }, [artifact, externalCqlList]);

  const addInstance = (
    treeName: string,
    instance: Instance,
    parentPath: string,
    uid: string | null = null,
    currentIndex: number | null = null,
    incomingTree: Instance | null = null,
    updatedReturnType: string | null = null
  ): void => {
    if (!artifact) return;
    if (treeName !== 'expTreeInclude' && treeName !== 'expTreeExclude') return;
    const { tree: foundTree, array: treeArray, index: treeIndex } = getTree(artifact, treeName, uid);
    const tree = incomingTree || foundTree;
    if (!tree) return;
    const target = findValueAtPath(tree as ExpressionTree, parentPath) as {
      childInstances?: Instance[];
    };
    if (!target.childInstances) return;
    const index = currentIndex != null ? currentIndex : target.childInstances.length;
    target.childInstances.splice(index, 0, instance); // Insert instance at specific instance - only used for indenting now

    if (updatedReturnType) {
      (tree as { returnType?: string }).returnType = updatedReturnType;
    }

    let artifactPropsToUpdate: Partial<Artifact> = { [treeName]: tree as ExpressionTree };
    if (treeArray != null && treeIndex != null) {
      treeArray[treeIndex] = tree as ExpressionTree;
      artifactPropsToUpdate = { [treeName]: treeArray as ExpressionTree[] };
    }

    const updatedArtifact = { ...artifact, ...artifactPropsToUpdate };
    const updatedFhirVersion = getFHIRVersion(updatedArtifact, externalCqlList, artifact._id || '');
    if (updatedFhirVersion !== artifact.fhirVersion) {
      artifactPropsToUpdate.fhirVersion = updatedFhirVersion;
    }

    handleUpdateArtifact(artifact, artifactPropsToUpdate);
  };

  const addBaseElement = (
    instance: Instance,
    uid: string | null = null,
    incomingTree: Instance[] | null = null
  ): void => {
    if (!artifact) return;
    const baseElements = artifact.baseElements || [];
    const tree = incomingTree || baseElements;
    tree.push(instance);

    let artifactPropsToUpdate: Partial<Artifact> = { baseElements: tree };

    const updatedArtifact = { ...artifact, ...artifactPropsToUpdate };
    const updatedFhirVersion = getFHIRVersion(updatedArtifact, externalCqlList, artifact._id || '');
    if (updatedFhirVersion !== artifact.fhirVersion) {
      artifactPropsToUpdate.fhirVersion = updatedFhirVersion;
    }

    handleUpdateArtifact(artifact, artifactPropsToUpdate);
  };

  const deleteInstance = (
    treeName: string,
    path: string,
    elementsToAdd: Array<{ instance: Instance; path: string; index?: number }> | null = null,
    uid: string | null = null,
    updatedReturnType: string | null = null
  ): void => {
    if (!artifact) return;
    if (treeName !== 'expTreeInclude' && treeName !== 'expTreeExclude') return;
    const { tree, array: treeArray, index: treeIndex } = getTree(artifact, treeName, uid);
    if (!tree) return;
    const index = parseInt(path.slice(-1), 10);
    const target = findValueAtPath(
      tree as Record<string, string | number | boolean | ExpressionTree | ExpressionTree[] | null | undefined>,
      path.slice(0, path.length - 2)
    ) as {
      splice: (index: number, count: number) => void;
    };
    target.splice(index, 1); // remove item at index position

    if (updatedReturnType) {
      (tree as { returnType?: string }).returnType = updatedReturnType;
    }

    // elementsToAdd is an array of elements to be re-added when indenting or outdenting
    if (elementsToAdd) {
      // Note: elements in elementsToAdd are a custom object with the element, path, and index to add
      elementsToAdd.forEach(element => {
        addInstance(treeName, element.instance, element.path, uid, element.index || null, tree, null);
      });
    }

    let artifactPropsToUpdate: Partial<Artifact> = { [treeName]: tree as ExpressionTree };
    if (treeArray != null) {
      treeArray[treeIndex] = tree;
      artifactPropsToUpdate = { [treeName]: treeArray as ExpressionTree[] };
    }

    const updatedArtifact = { ...artifact, ...artifactPropsToUpdate };
    const updatedFhirVersion = getFHIRVersion(updatedArtifact, externalCqlList, artifact._id || '');
    if (updatedFhirVersion !== artifact.fhirVersion) {
      artifactPropsToUpdate.fhirVersion = updatedFhirVersion;
    }

    handleUpdateArtifact(artifact, artifactPropsToUpdate);
  };

  const editInstance = (
    treeName: string,
    editedFields:
      | Array<Record<string, string | number | boolean | null | undefined>>
      | Record<string, string | number | boolean | null | undefined>,
    path: string,
    editingConjunctionType = false,
    uid: string | null = null
  ): void => {
    if (!artifact) return;
    if (treeName !== 'expTreeInclude' && treeName !== 'expTreeExclude') return;
    const { tree, array: treeArray, index: treeIndex } = getTree(artifact, treeName, uid);
    if (!tree) return;
    const target = findValueAtPath(
      tree as Record<
        string,
        string | number | boolean | ExpressionTree | ExpressionTree[] | Instance | Instance[] | null | undefined
      >,
      path
    ) as {
      id?: string;
      name?: string;
      fields?: Array<{ id?: string; [key: string]: unknown }>;
    };

    if (editingConjunctionType) {
      const fieldsObj = editedFields as { id?: string; name?: string };
      target.id = fieldsObj.id as string;
      target.name = fieldsObj.name as string;
    } else {
      // If only one field is being updated, it comes in as a single object. Put it into an array of objects.
      let fieldsArray: Array<Record<string, string | number | boolean | null | undefined>>;
      if (!Array.isArray(editedFields)) {
        fieldsArray = [editedFields];
      } else {
        fieldsArray = editedFields;
      }
      // Update each field attribute that needs updating. Then updated the full tree with changes.
      fieldsArray.forEach(editedField => {
        if (!target.fields) return;
        // function to retrieve relevant field
        const fieldIndex = target.fields.findIndex(field =>
          Object.prototype.hasOwnProperty.call(editedField, field.id || '')
        );

        if (fieldIndex === -1) return;

        // If an attribute was specified, update that one. Otherwise update the value attribute.
        if (editedField.attributeToEdit) {
          (target.fields[fieldIndex] as Record<string, string | number | boolean | null | undefined>)[
            editedField.attributeToEdit as string
          ] = editedField[(target.fields[fieldIndex].id || '') as keyof typeof editedField];
        } else {
          target.fields[fieldIndex].value =
            editedField[(target.fields[fieldIndex].id || '') as keyof typeof editedField];
        }
      });
    }

    let artifactPropsToUpdate: Partial<Artifact> = { [treeName]: tree as ExpressionTree };
    if (treeArray != null) {
      treeArray[treeIndex] = tree;
      artifactPropsToUpdate = { [treeName]: treeArray as ExpressionTree[] };
    }

    handleUpdateArtifact(artifact, artifactPropsToUpdate);
  };

  const updateInstanceModifiers = (
    treeName: string,
    modifiers: Modifier[],
    path: string,
    uid: string | null = null,
    updatedReturnType: string | null = null,
    fhirVersion: string | null = null
  ): void => {
    if (!artifact) return;
    if (treeName !== 'expTreeInclude' && treeName !== 'expTreeExclude') return;
    const { tree, array: treeArray, index: treeIndex } = getTree(artifact, treeName, uid);
    if (!tree) return;
    const target = findValueAtPath(tree as ExpressionTree, path) as { modifiers?: Modifier[] };
    target.modifiers = modifiers;

    if (updatedReturnType) {
      (tree as { returnType?: string }).returnType = updatedReturnType;
    }

    let artifactPropsToUpdate: Partial<Artifact> = { [treeName]: tree as ExpressionTree };
    if (treeArray != null) {
      treeArray[treeIndex] = tree;
      artifactPropsToUpdate = { [treeName]: treeArray as ExpressionTree[] };
    }

    if (fhirVersion) {
      artifactPropsToUpdate.fhirVersion = fhirVersion;
    }

    const updatedArtifact = { ...artifact, ...artifactPropsToUpdate };
    const updatedFhirVersion = getFHIRVersion(updatedArtifact, externalCqlList, artifact._id || '');
    if (updatedFhirVersion !== artifact.fhirVersion && fhirVersion == null) {
      artifactPropsToUpdate.fhirVersion = updatedFhirVersion;
    }

    handleUpdateArtifact(artifact, artifactPropsToUpdate);
  };

  const updateSubpopulations = (
    subpopulations: Subpopulation[] | Instance[],
    target = 'subpopulations',
    updateFHIRVersion = false
  ): void => {
    if (!artifact) return;
    const artifactPropsToUpdate: Partial<Artifact> = { [target]: subpopulations };
    if (updateFHIRVersion) {
      const updatedArtifact = { ...artifact, ...artifactPropsToUpdate };
      const updatedFhirVersion = getFHIRVersion(updatedArtifact, externalCqlList, artifact._id || '');
      if (updatedFhirVersion !== artifact.fhirVersion) {
        artifactPropsToUpdate.fhirVersion = updatedFhirVersion;
      }
    }

    handleUpdateArtifact(artifact, artifactPropsToUpdate);
  };

  const updateRecommendations = (recommendations: Recommendation[]): void => {
    if (!artifact) return;
    const artifactPropsToUpdate: Partial<Artifact> = { recommendations };
    const recommendationsArray = recommendations;
    if (artifact.fhirVersion === '' && recommendationsArray.some(rec => (rec.suggestions?.length || 0) > 0)) {
      // Once a suggestion is added, only FHIR R4 versions are allowed
      artifactPropsToUpdate.fhirVersion = '4.0.x';
    } else if (recommendationsArray.every(rec => (rec.suggestions?.length || 0) === 0)) {
      // If there are no suggestions, recalculate the FHIR version based on the rest of the artifact
      const updatedArtifact = { ...artifact, ...artifactPropsToUpdate };
      artifactPropsToUpdate.fhirVersion = getFHIRVersion(updatedArtifact, externalCqlList, artifact._id || '');
    }
    handleUpdateArtifact(artifact, artifactPropsToUpdate);
  };

  const TabIcon: React.FC<TabIconProps> = ({ hasContent, hasError }) => {
    if (hasContent && !hasError) return <CheckCircleIcon className={styles.tabIndicator} />;
    else if (hasError) return <ErrorIcon className={styles.tabIndicatorError} />;

    return null;
  };

  if (!artifact) return null;

  return (
    <div className={styles.body}>
      <Tabs
        selectedIndex={activeTab}
        selectedTabClassName={styles.tabSelected}
        onSelect={index => {
          dispatch(setActiveTab(index));
        }}
      >
        <TabList aria-label="Workspace Tabs" className={styles.tabList}>
          <Tab className={styles.tab}>Summary</Tab>
          <Tab className={styles.tab}>
            Inclusions <TabIcon {...tabMetadata.expTreeInclude} />
          </Tab>
          <Tab className={styles.tab}>
            Exclusions <TabIcon {...tabMetadata.expTreeExclude} />
          </Tab>
          <Tab className={styles.tab}>
            Subpopulations <TabIcon {...tabMetadata.subpopulations} />
          </Tab>
          <Tab className={styles.tab}>
            Base Elements <TabIcon {...tabMetadata.baseElements} />
          </Tab>
          <Tab className={styles.tab}>
            Recommendations <TabIcon {...tabMetadata.recommendations} />
          </Tab>
          <Tab className={styles.tab}>
            Parameters <TabIcon {...tabMetadata.parameters} />
          </Tab>
          <Tab className={styles.tab}>
            Handle Errors <TabIcon {...tabMetadata.handleErrors} />
          </Tab>
          <Tab className={styles.tab}>
            <MenuBookIcon className={styles.tabIndicator} />
            External CQL <TabIcon {...tabMetadata.externalCQL} />
          </Tab>
        </TabList>
        <div className={spacingStyles.verticalPadding}>
          <TabPanel>
            <Summary handleSaveArtifact={handleSaveArtifact} />
          </TabPanel>
          <TabPanel>
            <WorkspaceBlurb {...blurbs.inclusions} />
            <ConjunctionGroup
              addInstance={addInstance}
              deleteInstance={deleteInstance}
              editInstance={editInstance}
              instance={artifact.expTreeInclude}
              root={true}
              treeName={'expTreeInclude'}
              updateInstanceModifiers={updateInstanceModifiers}
            />
          </TabPanel>
          <TabPanel>
            <WorkspaceBlurb {...blurbs.exclusions} />
            <ConjunctionGroup
              addInstance={addInstance}
              deleteInstance={deleteInstance}
              editInstance={editInstance}
              instance={artifact.expTreeExclude}
              root={true}
              treeName={'expTreeExclude'}
              updateInstanceModifiers={updateInstanceModifiers}
            />
          </TabPanel>
          <TabPanel>
            <WorkspaceBlurb {...blurbs.subpopulations} />
            <Subpopulations
              addInstance={addInstance}
              deleteInstance={deleteInstance}
              editInstance={editInstance}
              updateInstanceModifiers={updateInstanceModifiers}
              updateSubpopulations={updateSubpopulations}
            />
          </TabPanel>
          <TabPanel>
            <WorkspaceBlurb {...blurbs.baseElements} />
            <BaseElements
              addBaseElement={addBaseElement}
              addInstance={addInstance}
              deleteInstance={deleteInstance}
              editInstance={editInstance}
              updateBaseElementLists={updateSubpopulations}
              updateInstanceModifiers={updateInstanceModifiers}
              validateReturnType={false}
            />
          </TabPanel>
          <TabPanel>
            <WorkspaceBlurb {...blurbs.recommendations} />
            <Recommendations handleUpdateRecommendations={updateRecommendations} />
          </TabPanel>
          <TabPanel>
            <WorkspaceBlurb {...blurbs.parameters} />
            <Parameters handleUpdateParameters={parameters => handleUpdateArtifact(artifact, { parameters })} />
          </TabPanel>
          <TabPanel>
            <WorkspaceBlurb {...blurbs.errors} />
            <ErrorStatement
              handleUpdateErrorStatement={errorStatement => handleUpdateArtifact(artifact, { errorStatement })}
            />
          </TabPanel>
          <TabPanel>
            <WorkspaceBlurb {...blurbs.externalCQL} />
            <ExternalCql />
          </TabPanel>
        </div>
      </Tabs>
    </div>
  );
};

export default WorkspaceTabs;
