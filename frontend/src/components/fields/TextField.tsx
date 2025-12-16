import React, { memo, useMemo } from 'react';
// eslint-disable-next-line import/named
import { FastField, useFormikContext, FieldInputProps, FormikProps } from 'formik';
import { TextField as MuiTextField } from '@mui/material';
import clsx from 'clsx';

import { isCpgComplete } from 'utils/fields';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

let labelUuid = 0;

interface MuiFastFieldProps {
  field: FieldInputProps<string>;
  form: FormikProps<Record<string, unknown>>;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

const MuiFastField: React.FC<MuiFastFieldProps> = ({
  field: { name, value, onChange, onBlur },
  form: { touched, errors },
  ...props
}) => (
  <MuiTextField
    error={touched[name] && Boolean(errors[name])}
    fullWidth
    helperText={touched[name] && errors[name] ? String(errors[name]) : undefined}
    hiddenLabel
    name={name}
    onBlur={onBlur}
    onChange={onChange}
    value={value || ''}
    variant="outlined"
    {...props}
  />
);

interface TextFieldProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  namePrefix?: string;
  isCpgField?: boolean;
}

const TextField: React.FC<TextFieldProps> = memo(
  ({ name, label, type = 'text', placeholder, helperText, required = false, namePrefix, isCpgField = false }) => {
    const { values } = useFormikContext();
    const fieldName = namePrefix ? `${namePrefix}.${name}` : name;
    const fieldStyles = useFieldStyles();
    const styles = useStyles();

    const labelId = useMemo(() => {
      if (!label) return null;
      return `TextField-${(labelUuid += 1)}`;
    }, [label]);

    return (
      <div className={fieldStyles.field}>
        {label && (
          <label htmlFor={labelId || undefined} className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)}>
            <div>
              {label}
              {required && <span className={styles.required}>*</span>}
            </div>
            {isCpgField && (
              <div className={clsx(styles.cpgTag, isCpgComplete(name, values) && styles.cpgTagComplete)}>CPG</div>
            )}
            :
          </label>
        )}

        <div className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputFullWidth)}>
          <FastField
            component={MuiFastField}
            id={labelId || undefined}
            name={fieldName}
            placeholder={placeholder}
            required={required}
            type={type}
          />

          {helperText && <div className={fieldStyles.helperText}>{helperText}</div>}
        </div>
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export default TextField;
