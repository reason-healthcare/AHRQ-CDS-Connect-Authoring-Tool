import React, { useState } from 'react';
import { Button } from '@mui/material';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';

import ModifierModalHeader from './ModifierModalHeader';
import ModifierSelector from './ModifierSelector';
import ModifierBuilder from './ModifierBuilder';
import FhirVersionSelect from './FhirVersionSelect';
import { Tooltip } from 'components/elements';
import { ruleTreeIsEmpty } from './ModifierBuilder/utils/ruleTreeIsEmpty';
import { Modal } from 'components/elements';
import { updateArtifact } from 'actions/artifacts';
import { resourceMap } from 'queries/modifier-builder/fetchResource';
import type { Instance, Modifier } from 'utils/instances';
import type { ModifierTree } from './types';
import type { RootState } from '../../../reducers';
import useStyles from './styles';
import ruleIsComplete from './ModifierBuilder/utils/ruleIsComplete';

type DisplayMode = 'selectModifiers' | 'buildModifier' | 'editModifier' | 'selectFhirVersion' | null;

export interface ModifierModalProps {
  elementInstance: Instance;
  handleCloseModal: () => void;
  handleUpdateModifiers: (modifiers: Modifier[], fhirVersion: string) => void;
  hasLimitedModifiers?: boolean;
  modifierToEdit?: ModifierTree;
}

const ModifierModal: React.FC<ModifierModalProps> = ({
  elementInstance,
  handleCloseModal,
  handleUpdateModifiers,
  hasLimitedModifiers = false,
  modifierToEdit
}) => {
  const artifact = useSelector((state: RootState) => state.artifacts.artifact);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(modifierToEdit ? 'editModifier' : null);
  const [modifiersToAdd, setModifiersToAdd] = useState<Array<ModifierTree & { uniqueId?: string; name?: string }>>(
    modifierToEdit
      ? [
          {
            ...modifierToEdit,
            uniqueId: (modifierToEdit.uniqueId as string | undefined) || undefined,
            name: modifierToEdit.name
          }
        ]
      : []
  );
  const [fhirVersion, setFhirVersion] = useState<string>(artifact.fhirVersion || '');
  const dispatch = useAppDispatch();
  const styles = useStyles();
  const typeSupportedByBuilder =
    Boolean(resourceMap[elementInstance.returnType || '']) &&
    (fhirVersion === '' || resourceMap[elementInstance.returnType || '']?.supportedVersions.includes(fhirVersion));
  const hasModifiers = elementInstance.modifiers?.length !== 0;

  let modalTitle = 'Add Modifiers';
  if (displayMode === 'selectModifiers') modalTitle = 'Select Modifiers';
  if (displayMode === 'buildModifier') modalTitle = 'Build Modifier';
  if (displayMode === 'editModifier') modalTitle = 'Edit Modifier';

  const handleSaveModal = async (): Promise<void> => {
    if (fhirVersion !== artifact.fhirVersion) {
      // updateArtifact returns a thunk that dispatches an action
      // The dispatch will execute it and return the action object
      await dispatch(updateArtifact(artifact, { fhirVersion: fhirVersion }));
    }
    const { modifierTreesToModifiers } = await import('utils/modifierConversions');
    const convertedModifiers = modifierTreesToModifiers(modifiersToAdd);
    handleUpdateModifiers(
      modifierToEdit ? convertedModifiers : (elementInstance.modifiers || []).concat(convertedModifiers),
      fhirVersion
    );
    handleCloseModal();
  };

  const handleReset = (): void => {
    setFhirVersion(artifact.fhirVersion || '');
    setDisplayMode(null);
    setModifiersToAdd([]);
  };

  const handleSetFhirVersion = (newVersion: string): void => {
    setFhirVersion(newVersion);
    setDisplayMode('buildModifier');
  };

  let submitDisabled = true;
  if (displayMode === 'selectModifiers') {
    submitDisabled = modifiersToAdd.length === 0;
  } else if (displayMode === 'buildModifier' || displayMode === 'editModifier') {
    const firstModifier = modifiersToAdd[0] as ModifierTree | undefined;
    submitDisabled =
      modifiersToAdd.length === 0 ||
      (firstModifier && ruleTreeIsEmpty(firstModifier)) ||
      !(firstModifier?.where?.rules?.every(rule => ruleIsComplete(rule)) ?? false);
  }

  return (
    <Modal
      handleCloseModal={handleCloseModal}
      handleSaveModal={handleSaveModal}
      Header={
        <ModifierModalHeader
          elementInstance={elementInstance}
          modifiersToAdd={modifiersToAdd as Array<Modifier & { uniqueId?: string; name?: string }>}
        />
      }
      hasCancelButton
      hasEnterKeySubmit={false}
      isOpen
      submitButtonText={modifierToEdit ? 'Save' : 'Add'}
      submitDisabled={submitDisabled}
      title={modalTitle}
      maxWidth="xl"
    >
      <div className={styles.modifierModalContent}>
        {!displayMode && (
          <div className={styles.displayModeSelector}>
            <Button
              className={styles.displayModeButton}
              color="primary"
              onClick={() => setDisplayMode('selectModifiers')}
              variant="contained"
            >
              Select Modifiers
            </Button>

            <span>or</span>

            <Tooltip
              enabled={hasModifiers || !typeSupportedByBuilder}
              title={hasModifiers ? 'Cannot add a custom modifier to another modifier' : 'Return type not supported'}
            >
              <Button
                className={styles.displayModeButton}
                color="primary"
                disabled={hasModifiers || !typeSupportedByBuilder}
                onClick={() =>
                  setDisplayMode(
                    ['1.0.2', '3.0.0', '4.0.0', '4.0.1', '4.0.x'].includes(fhirVersion)
                      ? 'buildModifier'
                      : 'selectFhirVersion'
                  )
                }
                variant="contained"
              >
                Build New Modifier
              </Button>
            </Tooltip>
          </div>
        )}

        {displayMode === 'selectModifiers' && (
          <ModifierSelector
            elementInstance={elementInstance}
            handleGoBack={handleReset}
            hasLimitedModifiers={hasLimitedModifiers}
            modifiersToAdd={modifiersToAdd as Array<Modifier & { uniqueId?: string; name?: string }>}
            setModifiersToAdd={(modifiers: Array<Modifier & { uniqueId?: string; name?: string }>) =>
              setModifiersToAdd(modifiers as Array<ModifierTree & { uniqueId?: string; name?: string }>)
            }
          />
        )}

        {displayMode === 'selectFhirVersion' && <FhirVersionSelect handleSetFhirVersion={handleSetFhirVersion} />}

        {(displayMode === 'buildModifier' || displayMode === 'editModifier') && (
          <ModifierBuilder
            elementInstanceReturnType={elementInstance.returnType || ''}
            fhirVersion={fhirVersion}
            handleGoBack={handleReset}
            modifiersToAdd={modifiersToAdd as Array<Modifier & { uniqueId?: string; name?: string }>}
            modifierToEdit={modifierToEdit}
            setModifiersToAdd={(modifiers: Array<Modifier & { uniqueId?: string; name?: string }>) =>
              setModifiersToAdd(modifiers as Array<ModifierTree & { uniqueId?: string; name?: string }>)
            }
          />
        )}
      </div>
    </Modal>
  );
};

export default ModifierModal;
