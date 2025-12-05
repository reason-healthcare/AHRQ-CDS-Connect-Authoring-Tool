/* eslint-disable jsx-a11y/no-autofocus */
import React, { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLatest } from 'react-use';
import { TextField } from '@mui/material';
import { Alert } from '@mui/material';

// eslint-disable-next-line import/no-unresolved
import { useAppDispatch } from '../../store/hooks';

import { Link, Modal } from 'components/elements';
import { setVSACApiKey } from 'actions/vsac';
import authenticateVSAC from 'queries/authenticateVSAC';
import useStyles from './styles';

interface VSACAuthenticationModalProps {
  handleCloseModal: () => void;
}

const VSACAuthenticationModal: React.FC<VSACAuthenticationModalProps> = ({ handleCloseModal }) => {
  const [apiKey, setApiKey] = useState('');
  const apiKeyRef = useLatest(apiKey);
  const dispatch = useAppDispatch();
  const styles = useStyles();

  const {
    mutateAsync,
    isPending: isLoading,
    isError
  } = useMutation({
    mutationFn: authenticateVSAC
  });

  const closeModal = useCallback(() => {
    handleCloseModal();
    setApiKey('');
  }, [handleCloseModal]);

  const login = useCallback(async () => {
    const currentApiKey = apiKeyRef.current;

    try {
      await mutateAsync({ apiKey: currentApiKey }).then(() => {
        dispatch(setVSACApiKey(currentApiKey));
        closeModal();
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, [mutateAsync, apiKeyRef, dispatch, closeModal]);

  return (
    <Modal
      handleCloseModal={closeModal}
      handleSaveModal={login}
      isOpen
      hasCancelButton
      isLoading={isLoading}
      maxWidth="md"
      submitButtonText="Login"
      title="VSAC Authentication"
    >
      <div>
        <div>Use your UMLS Terminology Services API key to log in to VSAC to access value sets and codes.</div>

        <div className={styles.list}>
          <div className={styles.listItem}>
            Need an account?
            <Link
              href={`${process.env.PUBLIC_URL}/documentation/userguide#Requesting_UTS_Account`}
              text="Request a UMLS Terminology Services account."
            />
          </div>

          <div className={styles.listItem}>
            Don't know your UMLS API key?
            <Link
              href={`${process.env.PUBLIC_URL}/documentation/userguide#Accessing_UMLS_API_Key`}
              text="Find your UMLS Terminology Services API key."
            />
          </div>
        </div>

        <div className={styles.content}>
          <TextField
            autoComplete="current-password"
            autoFocus
            fullWidth
            label="API Key"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setApiKey(event.target.value)}
            type="password"
            value={apiKey}
          />

          {isError && <Alert severity="error">Authentication Error: Unauthorized, please try again.</Alert>}
        </div>
      </div>
    </Modal>
  );
};

export default VSACAuthenticationModal;
