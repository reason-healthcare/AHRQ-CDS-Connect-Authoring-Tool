import React, { useState, useCallback } from 'react';
import { Alert, Checkbox, FormGroup, FormControlLabel } from '@mui/material';

import { Modal } from 'components/elements';
import {
  purpose,
  definitions,
  intendedUsers,
  noAssurance,
  ownership,
  disclaimers,
  footnotes
} from 'components/documentation';
import useStyles from '../styles';

interface TermsAndConditionsProps {
  isOpen: boolean;
  logout: () => void;
  saveTermsDate: () => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ isOpen, logout, saveTermsDate }) => {
  const [accepted, setAccepted] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const styles = useStyles();

  const closeAndLogout = useCallback(() => {
    if (!showLogoutAlert) {
      setShowLogoutAlert(true);
    } else {
      logout();
    }
  }, [showLogoutAlert, logout]);

  const header = showLogoutAlert ? (
    <Alert severity="error" sx={{ marginTop: '5px' }}>
      Please accept the terms and conditions to continue using the Authoring Tool. Closing this window without accepting
      the terms will log you out.
    </Alert>
  ) : (
    <></>
  );

  const footer = (
    <FormGroup>
      <FormControlLabel
        label={'I have read and agree to these Authoring Tool Terms and Conditions'}
        control={
          <Checkbox aria-label="accept" color="default" checked={accepted} onChange={() => setAccepted(!accepted)} />
        }
      />
    </FormGroup>
  );

  return (
    <Modal
      Header={header}
      Footer={footer}
      handleCloseModal={closeAndLogout}
      handleSaveModal={saveTermsDate}
      submitDisabled={!accepted}
      isOpen={isOpen}
      hasEnterKeySubmit={false}
      disableBackdropClick={true}
      submitButtonText="Accept"
      theme="dark"
      title="Please review and accept the Authoring Tool Terms and Conditions"
    >
      <>
        <div className={styles.terms}>
          <div className={styles.termsHeader}>Requirements for Authoring Tool Use</div>
          <div className={styles.termsSection}>I. Purpose</div>
          {purpose}

          <div className={styles.termsSection}>II. Definitions</div>
          {definitions}

          <div className={styles.termsSection}>III. Intended Users</div>
          {intendedUsers}

          <div className={styles.termsSection}>IV. No Assurance of Artifact Acceptance</div>
          {noAssurance}

          <div className={styles.termsSection}>V. Ownership</div>
          {ownership}

          <div className={styles.termsSection}>VI. Disclaimers</div>
          {disclaimers}

          {footnotes}
        </div>
      </>
    </Modal>
  );
};

export default TermsAndConditions;
