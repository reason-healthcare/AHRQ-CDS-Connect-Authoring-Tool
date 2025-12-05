import React, { useState } from 'react';
import { Button, IconButton } from '@mui/material';
import { Edit as EditIcon, LocalHospital as LocalHospitalIcon } from '@mui/icons-material';
import clsx from 'clsx';

import { ValueSetSelectModal, VSACAuthenticationModal } from 'components/modals';
import { useSpacingStyles, useTextStyles } from 'styles/hooks';
// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';
import useStyles from './styles';

export interface ValueSetValue {
  name: string;
  oid: string;
  [key: string]: unknown;
}

interface ValueSetEditorProps {
  handleUpdateEditor: (value: ValueSetValue) => void;
  value?: ValueSetValue;
}

const ValueSetEditor: React.FC<ValueSetEditorProps> = ({ handleUpdateEditor, value }) => {
  const [showValueSetSelectModal, setShowValueSetSelectModal] = useState(false);
  const [showVSACAuthModal, setShowVSACAuthModal] = useState(false);
  const vsacApiKey = useAppSelector(state => state.vsac.apiKey);
  const spacingStyles = useSpacingStyles();
  const textStyles = useTextStyles();
  const styles = useStyles();

  return (
    <div className={clsx(spacingStyles.marginTopHalf, spacingStyles.fullWidth)}>
      {value ? (
        <div className={styles.editorDisplayGroup}>
          <div className={styles.editorDisplay}>
            {value.name}
            <span className={clsx(spacingStyles.marginLeft, spacingStyles.marginRight, textStyles.subtext)}>
              (OID: {value.oid})
            </span>
          </div>

          <IconButton
            aria-label="edit value set"
            color="primary"
            onClick={() => setShowValueSetSelectModal(true)}
            size="large"
          >
            <EditIcon />
          </IconButton>
        </div>
      ) : (
        <Button
          color="primary"
          onClick={Boolean(vsacApiKey) ? () => setShowValueSetSelectModal(true) : () => setShowVSACAuthModal(true)}
          startIcon={Boolean(vsacApiKey) && <LocalHospitalIcon />}
          variant="contained"
        >
          {Boolean(vsacApiKey) ? 'Add Valueset' : 'Authenticate VSAC'}
        </Button>
      )}

      {showVSACAuthModal && <VSACAuthenticationModal handleCloseModal={() => setShowVSACAuthModal(false)} />}

      {showValueSetSelectModal && (
        <ValueSetSelectModal
          handleCloseModal={() => setShowValueSetSelectModal(false)}
          handleSelectValueSet={handleUpdateEditor}
        />
      )}
    </div>
  );
};

export default ValueSetEditor;
