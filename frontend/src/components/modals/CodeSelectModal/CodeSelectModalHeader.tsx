import React, { useCallback } from 'react';
import { Alert, Button, TextField } from '@mui/material';

import { Dropdown, Link } from 'components/elements';
import codeSystemOptions from 'data/codeSystemOptions';
import useStyles from '../styles';

interface CodeSelectModalHeaderProps {
  code: string;
  codeSystem: string | null;
  isValidating: boolean;
  onValidate: () => void;
  otherCodeSystem: string;
  setCode: (value: string) => void;
  setCodeSystem: (value: string | null) => void;
  setOtherCodeSystem: (value: string) => void;
}

const CodeSelectModalHeader: React.FC<CodeSelectModalHeaderProps> = ({
  code,
  codeSystem,
  isValidating,
  onValidate,
  otherCodeSystem,
  setCode,
  setCodeSystem,
  setOtherCodeSystem
}) => {
  const styles = useStyles();

  const handleValidate = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      onValidate();
    },
    [onValidate]
  );

  return (
    <>
      {codeSystem === 'Other' && (
        <Alert severity="info">
          Code systems should use their canonical URL. See{' '}
          <Link
            external
            href="http://hl7.org/fhir/uv/cpg/STU1/libraries.html#code-systems"
            text="FHIR® Clinical Guidelines"
          />{' '}
          for more information.
        </Alert>
      )}

      <div className={styles.searchContainer}>
        <form onSubmit={handleValidate} className={styles.form}>
          <TextField
            className={styles.formInput}
            fullWidth
            id="select-code-code"
            label="Code"
            onChange={event => setCode(event.target.value)}
            value={code}
          />

          <Dropdown
            className={styles.formInput}
            id="select-code-system"
            label="Code system"
            onChange={event => setCodeSystem(event.target.value || null)}
            options={codeSystemOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            value={codeSystem || ''}
          />

          {codeSystem === 'Other' && (
            <TextField
              className={styles.formInput}
              fullWidth
              id="select-code-system-url"
              label="System URI"
              onChange={event => setOtherCodeSystem(event.target.value)}
              value={otherCodeSystem}
            />
          )}

          <Button color="primary" disabled={isValidating} type="submit" variant="contained">
            Validate
          </Button>
        </form>
      </div>
    </>
  );
};

export default CodeSelectModalHeader;
