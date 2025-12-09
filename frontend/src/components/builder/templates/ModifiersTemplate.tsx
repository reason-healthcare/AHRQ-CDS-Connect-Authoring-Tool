import React, { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useQuery } from '@tanstack/react-query';
import { Alert, Divider, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import ElementCardLabel from 'components/elements/ElementCard/ElementCardLabel';
import { ModifierForm } from 'components/builder/modifiers';
import { Tooltip } from 'components/elements';
import { DeleteConfirmationModal } from 'components/modals';
import { fetchModifiers } from 'queries/modifiers';
import { validateModifier } from 'utils/instances';
import { changeToCase } from 'utils/strings';
import { modifierCanBeRemoved } from 'components/builder/modifiers/utils';
import type { Instance, Modifier } from '../../../utils/instances';

interface ModifierTemplateProps {
  baseElementIsUsed: boolean;
  elementInstance: Instance;
  handleRemoveModifier: (index: number) => void;
  handleUpdateModifier: (index: number, modifier: Modifier | Modifier[]) => void;
  index: number;
  modifier: Modifier;
}

const ModifierTemplate: React.FC<ModifierTemplateProps> = ({
  baseElementIsUsed,
  elementInstance,
  handleRemoveModifier,
  handleUpdateModifier,
  index,
  modifier
}) => {
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const query = { artifactId: artifact?._id };
  const modifiersQuery = useQuery({
    queryKey: ['modifiers', query],
    queryFn: () => fetchModifiers(query),
    enabled: query.artifactId != null
  });
  const modifierMap = (modifiersQuery.data?.modifierMap as Record<string, { values?: unknown }>) || {};

  // Reset values on modifiers that were not previously set or saved in the database
  if (!modifier.values && modifierMap[modifier.id || ''] && modifierMap[modifier.id || ''].values) {
    modifier.values = modifierMap[modifier.id || ''].values;
  }

  const { modifiers, returnType } = elementInstance;
  const { canBeRemoved, tooltipText } = modifierCanBeRemoved(
    Boolean(baseElementIsUsed),
    index,
    returnType,
    modifiers || []
  );
  const validationWarning = validateModifier(modifier);

  const handleDeleteModifier = (): void => {
    handleRemoveModifier(index);
    setShowDeleteConfirmationModal(false);
  };

  return (
    <Stack id="modifiers-template" width="100%">
      <Stack direction="row" justifyContent="space-between">
        <ModifierForm
          elementInstance={elementInstance}
          handleUpdateModifier={modifier => handleUpdateModifier(index, modifier)}
          modifier={modifier}
        />

        <Tooltip enabled={!canBeRemoved} placement="left" title={tooltipText}>
          <IconButton
            aria-label="remove modifier"
            disabled={!canBeRemoved}
            color="primary"
            onClick={() => setShowDeleteConfirmationModal(true)}
            sx={{ marginTop: '5px' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {validationWarning && (
        <Alert severity="error" sx={{ marginBottom: '10px' }}>
          {validationWarning}
        </Alert>
      )}

      <Divider />

      {showDeleteConfirmationModal && (
        <DeleteConfirmationModal
          deleteType="Modifier"
          handleCloseModal={() => setShowDeleteConfirmationModal(false)}
          handleDelete={handleDeleteModifier}
        >
          <>
            <div>Modifier Name: {modifier.name || 'Custom Modifier'}</div>
            <div>Return Type: {changeToCase(modifier.returnType || '', 'capitalCase')}</div>
          </>
        </DeleteConfirmationModal>
      )}
    </Stack>
  );
};

interface ModifiersTemplateProps {
  baseElementIsUsed?: boolean;
  elementInstance: Instance;
  handleRemoveModifier: (index: number) => void;
  handleUpdateModifier: (index: number, modifier: Modifier | Modifier[]) => void;
}

const ModifiersTemplate: React.FC<ModifiersTemplateProps> = ({
  baseElementIsUsed,
  elementInstance,
  handleRemoveModifier,
  handleUpdateModifier
}) => {
  const { modifiers } = elementInstance;

  return (
    <Stack direction="row">
      <ElementCardLabel label="Modifiers" mt="10px" />

      <Stack width="100%">
        {modifiers &&
          modifiers.map((modifier, index) => (
            <ModifierTemplate
              key={index}
              baseElementIsUsed={Boolean(baseElementIsUsed)}
              elementInstance={elementInstance}
              handleRemoveModifier={handleRemoveModifier}
              handleUpdateModifier={handleUpdateModifier}
              index={index}
              modifier={modifier}
            />
          ))}
      </Stack>
    </Stack>
  );
};

export default ModifiersTemplate;
