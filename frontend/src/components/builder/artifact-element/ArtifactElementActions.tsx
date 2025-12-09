import React from 'react';
import { Stack } from '@mui/material';

import SelectModifierAction from './SelectModifierAction';
import VSACOptionsAction from './VSACOptionsAction';
import type { Instance, Modifier } from '../../../utils/instances';

interface ArtifactElementActionsProps {
  allowsVSAC: boolean;
  hasLimitedModifiers?: boolean;
  elementInstance: Instance;
  handleUpdateElement: (newElementField: Record<string, unknown>) => void;
  isLoadingModifiers?: boolean;
  modifiersByInputType: Record<string, Modifier[]>;
  updateModifiers: (modifiers: Modifier[], fhirVersion?: string | null) => void;
}

const ArtifactElementActions: React.FC<ArtifactElementActionsProps> = ({
  allowsVSAC,
  hasLimitedModifiers,
  elementInstance,
  handleUpdateElement,
  isLoadingModifiers,
  modifiersByInputType,
  updateModifiers
}) => {
  return (
    <Stack>
      <SelectModifierAction
        elementInstance={elementInstance}
        hasLimitedModifiers={hasLimitedModifiers}
        isLoadingModifiers={isLoadingModifiers}
        modifiersByInputType={modifiersByInputType}
        updateModifiers={updateModifiers}
      />
      <VSACOptionsAction
        allowsVSAC={allowsVSAC}
        elementInstance={elementInstance}
        handleUpdateElement={handleUpdateElement}
      />
    </Stack>
  );
};

export default ArtifactElementActions;
