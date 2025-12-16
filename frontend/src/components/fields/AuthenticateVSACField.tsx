import React, { memo, useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLatest } from 'react-use';
import { Alert, Button, CircularProgress, TextField } from '@mui/material';
import { Check as CheckIcon, Lock as LockIcon } from '@mui/icons-material';

// eslint-disable-next-line import/no-unresolved
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import { Link } from 'components/elements';
import { setVSACApiKey } from 'actions/vsac';
import authenticateVSAC from 'queries/authenticateVSAC';
import useStyles from './styles';

const AuthenticateVSACField: React.FC = memo(() => {
  const [apiKey, setApiKey] = useState('');
  const apiKeyRef = useLatest(apiKey);
  const dispatch = useAppDispatch();
  const reduxApiKey = useAppSelector(state => state.vsac.apiKey);
  const {
    mutateAsync,
    isPending: isLoading,
    isError,
    isSuccess,
    reset
  } = useMutation({
    mutationFn: authenticateVSAC
  });
  const styles = useStyles();

  const onLogin = useCallback(async () => {
    const currentApiKey = apiKeyRef.current;

    try {
      await mutateAsync({ apiKey: currentApiKey }).then(() => {
        dispatch(setVSACApiKey(currentApiKey));
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, [apiKeyRef, mutateAsync, dispatch]);

  if (reduxApiKey) return null;

  return (
    <>
      <div className={styles.listText}>
        Use your UMLS Terminology Services API key to log in to VSAC to access value sets and codes.
      </div>

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

      <div className={styles.fieldGroup}>
        <TextField
          autoComplete="current-password"
          fullWidth
          label="API Key"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setApiKey(event.target.value)}
          type="password"
          value={apiKey}
        />

        {isError && (
          <Alert severity="error" onClose={reset}>
            Authentication Error: Unauthorized, please try again.
          </Alert>
        )}

        <div className={styles.fieldGroupButton}>
          <Button
            color="primary"
            disabled={isLoading}
            onClick={onLogin}
            startIcon={isLoading ? <CircularProgress size={20} /> : isSuccess ? <CheckIcon /> : <LockIcon />}
            variant="contained"
          >
            {isSuccess ? 'VSAC Authenticated' : 'Authenticate VSAC'}
          </Button>
        </div>
      </div>
    </>
  );
});

AuthenticateVSACField.displayName = 'AuthenticateVSACField';

export default AuthenticateVSACField;
