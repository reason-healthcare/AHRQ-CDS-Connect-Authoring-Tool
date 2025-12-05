import React, { memo, useMemo } from 'react';
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
    multiline
    name={name}
    onBlur={onBlur}
    onChange={onChange}
    value={value || ''}
    variant="outlined"
    {...props}
  />
);

interface TextAreaFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  namePrefix?: string;
  isCpgField?: boolean;
}

const TextAreaField: React.FC<TextAreaFieldProps> = memo(
  ({ name, label, placeholder, helperText, namePrefix, isCpgField = false }) => {
    const { values } = useFormikContext();
    const fieldName = namePrefix ? `${namePrefix}.${name}` : name;
    const fieldStyles = useFieldStyles();
    const styles = useStyles();

    const labelId = useMemo(() => {
      if (!label) return null;
      return `TextAreaField-${(labelUuid += 1)}`;
    }, [label]);

    return (
      <div className={fieldStyles.field}>
        {label && (
          <label htmlFor={labelId || undefined} className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)}>
            {label}
            {isCpgField && (
              <div className={clsx(styles.cpgTag, isCpgComplete(name, values) && styles.cpgTagComplete)}>CPG</div>
            )}
            :
          </label>
        )}

        <div className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputFullWidth)}>
          <FastField component={MuiFastField} id={labelId || undefined} name={fieldName} placeholder={placeholder} />

          {helperText && <div className={fieldStyles.helperText}>{helperText}</div>}
        </div>
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';

export default TextAreaField;


