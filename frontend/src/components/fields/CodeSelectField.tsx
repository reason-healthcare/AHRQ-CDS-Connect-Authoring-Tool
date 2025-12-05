import React, { memo, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLatest, usePrevious } from 'react-use';
import { Alert, CircularProgress } from '@mui/material';
import { useField } from 'formik';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../store/hooks';

import codeSystemOptions from 'data/codeSystemOptions';
import validateCode from 'queries/validateCode';
import AutocompleteField from './AutocompleteField';
import TextField from './TextField';
import useStyles from './styles';

interface CodeSelectFieldProps {
  namePrefix?: string;
}

const CodeSelectField: React.FC<CodeSelectFieldProps> = memo(({ namePrefix }) => {
  const codeFieldName = namePrefix ? `${namePrefix}.code` : 'code';
  const systemFieldName = namePrefix ? `${namePrefix}.system` : 'system';
  const otherFieldName = namePrefix ? `${namePrefix}.other` : 'other';
  const {
    mutateAsync,
    data: codeData,
    isPending: isLoading,
    isSuccess,
    isError,
    reset
  } = useMutation({
    mutationFn: validateCode
  });
  const vsacApiKey = useAppSelector(state => state.vsac.apiKey);
  const [{ value: codeFieldValue }] = useField(codeFieldName);
  const [{ value: systemFieldValue }] = useField(systemFieldName);
  const [{ value: otherFieldValue }] = useField(otherFieldName);
  const prevCodeValue = usePrevious(codeFieldValue);
  const prevSystemValue = usePrevious(systemFieldValue);
  const prevOtherValue = usePrevious(otherFieldValue);
  const fieldValuesRef = useLatest({
    code: codeFieldValue,
    system: systemFieldValue,
    other: otherFieldValue
  });
  const styles = useStyles();

  const handleValidateCode = useCallback(async () => {
    const { code, system } = fieldValuesRef.current;

    if (!system || !code || !vsacApiKey) return;
    const systemId = codeSystemOptions.find(({ value }) => value === system)?.id;
    if (!systemId) return;
    try {
      await mutateAsync({ code, system: systemId, apiKey: vsacApiKey });
    } catch (error) {
      console.error('Code validation failed:', error);
    }
  }, [fieldValuesRef, vsacApiKey, mutateAsync]);

  useEffect(() => {
    if (
      (codeFieldValue !== prevCodeValue ||
        systemFieldValue !== prevSystemValue ||
        otherFieldValue !== prevOtherValue) &&
      codeFieldValue &&
      systemFieldValue &&
      vsacApiKey
    ) {
      handleValidateCode();
    }
  }, [
    codeFieldValue,
    systemFieldValue,
    otherFieldValue,
    prevCodeValue,
    prevSystemValue,
    prevOtherValue,
    vsacApiKey,
    handleValidateCode
  ]);

  return (
    <div className={styles.fieldGroup}>
      {/* @ts-expect-error - AutocompleteField is still JS */}
      <AutocompleteField label="Code System" name={systemFieldName} options={codeSystemOptions} />

      {systemFieldValue === 'Other' ? (
        // @ts-expect-error - TextField is still JS
        <TextField label="Code System" name={otherFieldName} />
      ) : (
        // @ts-expect-error - TextField is still JS
        <TextField label="Code" name={codeFieldName} />
      )}

      {isLoading && (
        <div>
          <CircularProgress size={20} />
        </div>
      )}

      {isError && (
        <Alert severity="error" onClose={reset}>
          Code validation failed. Please check your code and code system.
        </Alert>
      )}

      {isSuccess && codeData && (
        <Alert severity="success">
          Code validated successfully. Display name: {(codeData as { displayName?: string })?.displayName || 'N/A'}
        </Alert>
      )}
    </div>
  );
});

CodeSelectField.displayName = 'CodeSelectField';

export default CodeSelectField;
