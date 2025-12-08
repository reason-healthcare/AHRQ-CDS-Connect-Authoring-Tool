import React, { useState } from 'react';
import { IconButton } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

import { ModifierModal } from 'components/modals';
import type { Instance, Modifier } from '../../../utils/instances';
import type { ModifierTree } from '../../modals/ModifierModal/types';
import makeStyles from './styles';

interface UserDefinedModifierProps {
  elementInstance: Instance;
  handleUpdateModifier: (modifier: Modifier) => void;
  label: string;
  modifier: Modifier;
}

const UserDefinedModifier: React.FC<UserDefinedModifierProps> = ({
  elementInstance,
  handleUpdateModifier,
  label,
  modifier
}) => {
  const [showModifierModal, setShowModifierModal] = useState(false);
  const modifierStyles = makeStyles();

  const handleUpdateModifiers = (modifiers: Modifier[], fhirVersion: string): void => {
    // For UserDefinedModifier, we only update the single modifier
    if (modifiers.length > 0) {
      handleUpdateModifier(modifiers[0]);
    }
  };

  return (
    <div className={modifierStyles.customModifier}>
      <div className={modifierStyles.modifierMargin}>{label}</div>

      <IconButton aria-label="edit" onClick={() => setShowModifierModal(true)} size="large">
        <EditIcon color="primary" fontSize="small" />
      </IconButton>

      {showModifierModal && (
        <ModifierModal
          elementInstance={elementInstance}
          handleCloseModal={() => setShowModifierModal(false)}
          handleUpdateModifiers={handleUpdateModifiers}
          modifierToEdit={modifier as unknown as ModifierTree}
        />
      )}
    </div>
  );
};

export default UserDefinedModifier;
