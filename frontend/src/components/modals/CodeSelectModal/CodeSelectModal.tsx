import React, { useCallback, useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useMutation } from '@tanstack/react-query';
import { useLatest } from 'react-use';
import { CircularProgress } from '@mui/material';

import CodeDetailsTable from './CodeDetailsTable';
import CodeSelectModalFooter from './CodeSelectModalFooter';
import CodeSelectModalHeader from './CodeSelectModalHeader';
import codeSystemOptions from 'data/codeSystemOptions';
import { Modal } from 'components/elements';
import validateCode from 'queries/validateCode';
import useStyles from '../styles';

interface CodeSelectModalProps {
  handleCloseModal: () => void;
  handleSelectCode: (code: { display: string; code: string; codeSystem: { name: string; id: string } }) => void;
  initialValue?: {
    code?: string;
    codeSystem?: { name?: string };
    otherCodeSystem?: string;
  };
}

const CodeSelectModal: React.FC<CodeSelectModalProps> = ({ handleCloseModal, handleSelectCode, initialValue }) => {
  const {
    mutateAsync,
    isPending: isLoading,
    isSuccess,
    status,
    data: codeData
  } = useMutation({
    mutationFn: validateCode
  });
  const [code, setCode] = useState(initialValue?.code || '');
  const [codeSystem, setCodeSystem] = useState<string | null>(initialValue?.codeSystem?.name || null);
  const [otherCodeSystem, setOtherCodeSystem] = useState(initialValue?.otherCodeSystem || '');
  const codeRef = useLatest(code);
  const codeSystemRef = useLatest(codeSystem);
  const otherCodeSystemRef = useLatest(otherCodeSystem);
  const codeDisplayNameRef = useLatest(codeData?.display);
  const apiKey = useAppSelector(state => state.vsac.apiKey);
  const styles = useStyles();

  const handleValidateCode = useCallback(async (): Promise<void> => {
    const selectedCodeSystem = codeSystemRef.current;
    const system = selectedCodeSystem
      ? selectedCodeSystem === 'Other'
        ? otherCodeSystemRef.current
        : codeSystemOptions.find(codeSystemOption => codeSystemOption.value === selectedCodeSystem)?.id || ''
      : '';

    try {
      await mutateAsync({ code: codeRef.current, system, apiKey: apiKey || '' });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [apiKey, codeRef, codeSystemRef, otherCodeSystemRef, mutateAsync]);

  const handleSaveCodeSelection = useCallback((): void => {
    const codeSystemId =
      codeSystemRef.current === 'Other'
        ? otherCodeSystemRef.current
        : codeSystemOptions.find(codeSystemOption => codeSystemOption.value === codeSystemRef.current)?.id;

    handleSelectCode({
      display: codeDisplayNameRef.current || '',
      code: codeRef.current,
      codeSystem: { name: codeSystemRef.current || '', id: codeSystemId || '' }
    });
    handleCloseModal();
  }, [handleCloseModal, handleSelectCode, codeDisplayNameRef, codeRef, codeSystemRef, otherCodeSystemRef]);

  return (
    <Modal
      Footer={<CodeSelectModalFooter isValidCode={status === 'idle' || isLoading ? null : isSuccess} />}
      handleCloseModal={handleCloseModal}
      handleSaveModal={handleSaveCodeSelection}
      hasCancelButton
      hasEnterKeySubmit={false}
      Header={
        <CodeSelectModalHeader
          code={code}
          codeSystem={codeSystem}
          isValidating={isLoading}
          onValidate={handleValidateCode}
          otherCodeSystem={otherCodeSystem}
          setCode={setCode}
          setCodeSystem={setCodeSystem}
          setOtherCodeSystem={setOtherCodeSystem}
        />
      }
      isOpen
      maxWidth="xl"
      submitButtonText="Select"
      submitDisabled={!code || !codeSystem}
      title="Choose code"
    >
      <div className={styles.content}>
        {isLoading && <CircularProgress />}
        {codeData && <CodeDetailsTable codeData={codeData as { code: string; systemName: string; display: string }} />}
      </div>
    </Modal>
  );
};

export default CodeSelectModal;
