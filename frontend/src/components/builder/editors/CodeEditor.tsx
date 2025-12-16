import React, { useState } from 'react';
import { Button, IconButton, Paper } from '@mui/material';
import { Close as CloseIcon, LocalHospital as LocalHospitalIcon, Lock as LockIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';

import { CodeSelectModal, VSACAuthenticationModal } from 'components/modals';
import { useFieldStyles } from 'styles/hooks';
// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

interface CodeData {
  code: string;
  display?: string;
  codeSystem: {
    name: string;
    id: string;
  };
}

export interface CodeValue {
  id: string;
  system: string;
  uri: string;
  code: string;
  display?: string;
  str: string;
}

interface CodeEditorButtonsProps {
  codeButtonText: string;
  handleSelectCode: (codeData: CodeData) => void;
}

const CodeEditorButtons: React.FC<CodeEditorButtonsProps> = ({ codeButtonText, handleSelectCode }) => {
  const [showCodeSelectModal, setShowCodeSelectModal] = useState(false);
  const [showVSACAuthModal, setShowVSACAuthModal] = useState(false);
  const vsacApiKey = useAppSelector(state => state.vsac.apiKey);

  return (
    <>
      {!Boolean(vsacApiKey) ? (
        <Button color="primary" onClick={() => setShowVSACAuthModal(true)} variant="contained" startIcon={<LockIcon />}>
          Authenticate VSAC
        </Button>
      ) : (
        <Button
          color="primary"
          onClick={() => setShowCodeSelectModal(true)}
          startIcon={<LocalHospitalIcon />}
          variant="contained"
        >
          {codeButtonText}
        </Button>
      )}

      {showVSACAuthModal && <VSACAuthenticationModal handleCloseModal={() => setShowVSACAuthModal(false)} />}

      {showCodeSelectModal && (
        <CodeSelectModal
          handleCloseModal={() => setShowCodeSelectModal(false)}
          handleSelectCode={(codeData: CodeData) => handleSelectCode(codeData)}
          initialValue={undefined}
        />
      )}
    </>
  );
};

interface CodeEditorFieldProps {
  label: string;
  value: string;
}

const CodeEditorField: React.FC<CodeEditorFieldProps> = ({ label, value }) => {
  const fieldStyles = useFieldStyles();

  return (
    <div className={fieldStyles.field}>
      <div className={clsx(fieldStyles.condensedFieldLabel, fieldStyles.fieldLabelNarrow)}>{label}:</div>
      <div className={fieldStyles.condensedFieldInput}>{value}</div>
    </div>
  );
};

interface CodeEditorPaperProps {
  handleDeleteCode: (value: CodeValue) => void;
  handleSelectCode: (codeData: CodeData) => void;
  isList: boolean;
  value: CodeValue;
}

const CodeEditorPaper: React.FC<CodeEditorPaperProps> = ({ handleDeleteCode, handleSelectCode, isList, value }) => {
  const fieldStyles = useFieldStyles();

  return (
    <Paper className={fieldStyles.fieldCard}>
      <div className={fieldStyles.fieldCardCloseButton}>
        <IconButton aria-label="close" color="primary" onClick={() => handleDeleteCode(value)} size="large">
          <CloseIcon />
        </IconButton>
      </div>

      <CodeEditorField label="Code" value={value.code} />
      <CodeEditorField label="System" value={value.system} />
      <CodeEditorField label="System URI" value={value.uri} />
      {value.display && <CodeEditorField label="Display" value={value.display} />}

      {!isList && (
        <div className={fieldStyles.fieldCardFooter}>
          <CodeEditorButtons codeButtonText="Change Code" handleSelectCode={handleSelectCode} />
        </div>
      )}
    </Paper>
  );
};

interface CodeEditorProps {
  handleUpdateEditor: (value: CodeValue | CodeValue[] | null) => void;
  isConcept?: boolean;
  isList?: boolean;
  value?: CodeValue | CodeValue[];
}

const CodeEditor: React.FC<CodeEditorProps> = ({ handleUpdateEditor, isConcept = false, isList = false, value }) => {
  const fieldStyles = useFieldStyles();

  const handleSelectCode = (codeData: CodeData): void => {
    const codeStr = `Code '${codeData.code.replace(/'/g, "\\'")}' from "${codeData.codeSystem.name}"`;
    const displayStr = ` display '${codeData.display}'`;
    const str = isConcept
      ? `Concept { ${codeStr} }${codeData.display ? displayStr : ''}`
      : `${codeStr}${codeData.display ? displayStr : ''}`;
    const newCode: CodeValue = {
      id: uuidv4(),
      system: codeData.codeSystem.name,
      uri: codeData.codeSystem.id,
      code: codeData.code,
      display: codeData.display,
      str
    };

    handleUpdateEditor(isList ? (value ? (value as CodeValue[]).concat([newCode]) : [newCode]) : newCode);
  };

  return (
    <div className={fieldStyles.fieldInputFullWidth} id="code-editor">
      {value &&
        isList &&
        (value as CodeValue[]).map((codeValue: CodeValue) => (
          <CodeEditorPaper
            key={codeValue.id}
            handleDeleteCode={(codeToDelete: CodeValue) =>
              handleUpdateEditor((value as CodeValue[]).filter(({ id }) => id !== codeToDelete.id))
            }
            handleSelectCode={handleSelectCode}
            isList
            value={codeValue}
          />
        ))}

      {value && !isList && (
        <CodeEditorPaper
          key={(value as CodeValue).id}
          handleDeleteCode={() => handleUpdateEditor(null)}
          handleSelectCode={handleSelectCode}
          isList={false}
          value={value as CodeValue}
        />
      )}

      {(!value || isList) && <CodeEditorButtons codeButtonText="Add Code" handleSelectCode={handleSelectCode} />}
    </div>
  );
};

export default CodeEditor;
