import React, { useCallback } from 'react';
import clsx from 'clsx';

import { Dropdown } from 'components/elements';
import { EditorsTemplate } from 'components/builder/templates';
import { useFieldStyles } from 'styles/hooks';
import type { CodeValue } from '../editors/CodeEditor';
import type { ValueSetValue } from '../editors/ValueSetEditor';
import useStyles from './styles';

const options = [
  { value: 'value is a code from', label: 'value is a code from' },
  { value: 'value is the code', label: 'value is the code' }
];

interface QualifierModifierProps {
  code?: CodeValue;
  handleUpdateModifier: (updates: {
    qualifier?: string | null;
    valueSet?: ValueSetValue | null;
    code?: CodeValue | null;
  }) => void;
  qualifier?: string;
  valueSet?: ValueSetValue;
}

const QualifierModifier: React.FC<QualifierModifierProps> = ({ code, handleUpdateModifier, qualifier, valueSet }) => {
  const fieldStyles = useFieldStyles();
  const styles = useStyles();
  const qualifierIsCode = qualifier === 'value is the code';

  const handleSelectQualifier = useCallback(
    (newQualifier: string) => {
      const selectedOption = options.find(option => option.value === newQualifier);
      handleUpdateModifier({ qualifier: selectedOption?.value, valueSet: null, code: null });
    },
    [handleUpdateModifier]
  );

  return (
    <div className={styles.modifier}>
      <div className={fieldStyles.fieldInputGroup}>
        <Dropdown
          className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputLg)}
          id="qualifier"
          label="Qualifier"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSelectQualifier(event.target.value)}
          options={options}
          value={qualifier}
        />
      </div>

      {qualifier && (
        <EditorsTemplate
          errors={undefined}
          handleUpdateEditor={
            qualifierIsCode
              ? (codeValue: CodeValue) => handleUpdateModifier({ qualifier, code: codeValue })
              : (valueSetValue: ValueSetValue) => handleUpdateModifier({ qualifier, valueSet: valueSetValue })
          }
          label=""
          type={qualifierIsCode ? 'system_code' : 'valueset'}
          value={qualifierIsCode ? code : valueSet}
        />
      )}
    </div>
  );
};

export default QualifierModifier;
