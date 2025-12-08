import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, CardActions } from '@mui/material';
import {
  Check as CheckIcon,
  List as ListIcon,
  LocalHospital as LocalHospitalIcon,
  Lock as LockIcon
} from '@mui/icons-material';

import { CodeSelectModal, ValueSetSelectModal, VSACAuthenticationModal } from 'components/modals';

interface CodeSelection {
  display: string;
  code: string;
  codeSystem: { name: string; id: string };
}

interface ValueSetSelection {
  name: string;
  oid: string;
}

interface ElementSelectActionsProps {
  handleSelectElement: (item: CodeSelection | ValueSetSelection, type: 'codes' | 'valueSets') => void;
}

const ElementSelectActions: React.FC<ElementSelectActionsProps> = ({ handleSelectElement }) => {
  const [showCodeSelectModal, setShowCodeSelectModal] = useState(false);
  const [showValueSetSelectModal, setShowValueSetSelectModal] = useState(false);
  const [showVSACAuthenticationModal, setShowVSACAuthenticationModal] = useState(false);
  const vsacApiKey = useSelector((state: { vsac: { apiKey?: string } }) => state.vsac.apiKey);

  return (
    <CardActions>
      <Button
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
            color="primary"
            onClick={() => setShowValueSetSelectModal(true)}
            startIcon={<ListIcon />}
            variant="contained"
          >
            Add Value Set
          </Button>

          <Button
            color="primary"
            onClick={() => setShowCodeSelectModal(true)}
            startIcon={<LocalHospitalIcon />}
            variant="contained"
          >
            Add Code
          </Button>
        </>
      )}

      {showCodeSelectModal && (
        <CodeSelectModal
          handleCloseModal={() => setShowCodeSelectModal(false)}
          handleSelectCode={code => handleSelectElement(code, 'codes')}
        />
      )}

      {showValueSetSelectModal && (
        <ValueSetSelectModal
          handleCloseModal={() => setShowValueSetSelectModal(false)}
          handleSelectValueSet={valueSet => handleSelectElement(valueSet, 'valueSets')}
        />
      )}

      {showVSACAuthenticationModal && (
        <VSACAuthenticationModal handleCloseModal={() => setShowVSACAuthenticationModal(false)} />
      )}
    </CardActions>
  );
};

export default ElementSelectActions;
