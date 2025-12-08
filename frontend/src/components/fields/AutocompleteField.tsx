import React, { memo, useCallback } from 'react';
import { FastField, useFormikContext, FieldInputProps, FormikProps } from 'formik';
import { Autocomplete, TextField } from '@mui/material';
import clsx from 'clsx';

import { isCpgComplete } from 'utils/fields';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

interface AutocompleteOption {
  label: string;
  value: string | number | null;
}

interface FormikSelectProps {
  field: FieldInputProps<string | number | null>;
  form: FormikProps<Record<string, unknown>>;
  options: AutocompleteOption[];
}

const FormikSelect: React.FC<FormikSelectProps> = ({
  field: { name, value, onChange },
  form: { setFieldValue },
  options
}) => {
  const handleChange = useCallback(
    (_event: React.SyntheticEvent, option: AutocompleteOption | null) => setFieldValue(name, option?.value || null),
    [name, setFieldValue]
  );
  const selectedOption = options.find(option => option.value === value) || null;
  const fieldStyles = useFieldStyles();

  return (
    <Autocomplete
      autoSelect
      autoHighlight
      className={fieldStyles.fieldInputLg}
      getOptionLabel={(option: AutocompleteOption) => option?.label || ''}
      id={name}
      onChange={handleChange}
      options={options}
      renderInput={params => <TextField {...params} hiddenLabel={Boolean(value)} label={value ? null : 'Select...'} />}
      value={selectedOption}
    />
  );
};

interface AutocompleteFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  options?: AutocompleteOption[];
  namePrefix?: string;
  isCpgField?: boolean;
}

const AutocompleteField: React.FC<AutocompleteFieldProps> = memo(
  ({ name, label, helperText, options = [], namePrefix, isCpgField = false }) => {
    const fieldName = namePrefix ? `${namePrefix}.${name}` : name;
    const { values } = useFormikContext();
    const fieldStyles = useFieldStyles();
    const styles = useStyles();

    return (
      <div className={fieldStyles.field}>
        {label && (
          <label htmlFor={fieldName} className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)}>
            <div>{label}</div>
            {isCpgField && (
              <div className={clsx(styles.cpgTag, isCpgComplete(name, values) && styles.cpgTagComplete)}>CPG</div>
            )}
            :
          </label>
        )}

        <div className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputFullWidth)}>
          <FastField
            aria-label={`Select ${name}`}
            classNamePrefix={name}
            component={FormikSelect}
            name={fieldName}
            options={options}
          />

          {helperText && <div className={fieldStyles.helperText}>{helperText}</div>}
        </div>
      </div>
    );
  }
);

AutocompleteField.displayName = 'AutocompleteField';

export default AutocompleteField;
