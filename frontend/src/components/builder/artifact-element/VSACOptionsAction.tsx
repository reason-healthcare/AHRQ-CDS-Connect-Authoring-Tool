import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import {
  Check as CheckIcon,
  List as ListIcon,
  LocalHospital as LocalHospitalIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import _ from 'lodash';
import { useAppSelector } from '../../../store/hooks';

import { CodeSelectModal, VSACAuthenticationModal, ValueSetSelectModal } from 'components/modals';
import { getFieldWithType, getFieldWithId } from 'utils/instances';
import type { Instance } from '../../../utils/instances';

interface VSACOptionsActionProps {
  allowsVSAC: boolean;
  elementInstance: Instance;
  handleUpdateElement: (newElementField: Record<string, unknown>) => void;
}

interface ValueSet {
  name: string;
  oid: string;
  [key: string]: unknown;
}

interface CodeData {
  code: string;
  codeSystem: { name: string; [key: string]: unknown };
  display?: string;
  [key: string]: unknown;
}

const VSACOptionsAction: React.FC<VSACOptionsActionProps> = ({ allowsVSAC, elementInstance, handleUpdateElement }) => {
  const vsacApiKey = useAppSelector(state => state.vsac.apiKey);
  const [showVSACAuthenticationModal, setShowVSACAuthenticationModal] = useState(false);
  const [showValueSetSelectModal, setShowValueSetSelectModal] = useState(false);
  const [showCodeSelectModal, setShowCodeSelectModal] = useState(false);

  const handleSelectValueSet = (valueSet: ValueSet): void => {
    const selectedTemplate = _.cloneDeep(elementInstance);
    const vsacField = getFieldWithType(selectedTemplate.fields, '_vsac');
    const nameField = getFieldWithId(selectedTemplate.fields, 'element_name');
    const valueSetsToAdd = (vsacField?.valueSets as ValueSet[]) || [];
    valueSetsToAdd.push(valueSet);

    // Create array of which field to update, the new value to set, and the attribute to update (value is default)
    const arrayToUpdate: Array<Record<string, unknown>> = [
      { [vsacField.id]: valueSetsToAdd, attributeToEdit: 'valueSets' },
      { [vsacField.id]: true, attributeToEdit: 'static' }
    ];

    // Only set name of element if there isn't one already
    if (!nameField.value) arrayToUpdate.push({ [nameField.id]: valueSet.name });
    handleUpdateElement(arrayToUpdate);
  };

  const handleSelectCode = (codeData: CodeData): void => {
    const selectedTemplate = _.cloneDeep(elementInstance);
    const vsacField = getFieldWithType(selectedTemplate.fields, '_vsac');
    const nameField = getFieldWithId(selectedTemplate.fields, 'element_name');
    const codesToAdd = (vsacField?.codes as CodeData[]) || [];
    codesToAdd.push(codeData);

    // Create array of which field to update, the new value to set, and the attribute to update (value is default)
    const arrayToUpdate: Array<Record<string, unknown>> = [
      { [vsacField.id]: codesToAdd, attributeToEdit: 'codes' },
      { [vsacField.id]: true, attributeToEdit: 'static' }
    ];

    if (!nameField.value || nameField.value === '') {
      const newName =
        codeData.display && codeData.display.length < 60
          ? codeData.display
          : `${codeData.codeSystem.name} ${codeData.code}`;
      arrayToUpdate.push({ [nameField.id]: newName });
    }

    handleUpdateElement(arrayToUpdate);
  };

  if (!allowsVSAC) return <></>;
  return (
    <Box>
      <Button
        sx={{ marginRight: '10px' }}
        color="primary"
        disabled={Boolean(vsacApiKey)}
        onClick={() => setShowVSACAuthenticationModal(true)}
        variant="contained"
        startIcon={Boolean(vsacApiKey) ? <CheckIcon /> : <LockIcon />}
      >
        {Boolean(vsacApiKey) ? 'VSAC Authenticated' : 'Authenticate VSAC'}
      </Button>

      {Boolean(vsacApiKey) && (
        <>
          <Button
            sx={{ marginRight: '10px' }}
            color="primary"
            onClick={() => setShowValueSetSelectModal(true)}
            startIcon={<ListIcon />}
            variant="contained"
          >
            Add Value Set
          </Button>

          <Button
            sx={{ marginRight: '10px' }}
            color="primary"
            onClick={() => setShowCodeSelectModal(true)}
            startIcon={<LocalHospitalIcon />}
            variant="contained"
          >
            Add Code
          </Button>
        </>
      )}

      {showVSACAuthenticationModal && (
        <VSACAuthenticationModal handleCloseModal={() => setShowVSACAuthenticationModal(false)} />
      )}

      {showValueSetSelectModal && (
        <ValueSetSelectModal
          handleCloseModal={() => setShowValueSetSelectModal(false)}
          handleSelectValueSet={(valueSet: ValueSet) => handleSelectValueSet(valueSet)}
        />
      )}

      {showCodeSelectModal && (
        <CodeSelectModal
          handleCloseModal={() => setShowCodeSelectModal(false)}
          handleSelectCode={(codeData: CodeData) => handleSelectCode(codeData)}
        />
      )}
    </Box>
  );
};

export default VSACOptionsAction;
