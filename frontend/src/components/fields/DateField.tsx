import React, { memo, useState, useCallback } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useField, useFormikContext } from 'formik';
import clsx from 'clsx';

import { DatePicker } from 'components/elements/Pickers';
import { isCpgComplete } from 'utils/fields';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

interface DateFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  noDateOption?: boolean;
  noDateText?: string;
  namePrefix?: string;
  isCpgField?: boolean;
}

const DateField: React.FC<DateFieldProps> = memo(
  ({ name, label, helperText, noDateOption = false, noDateText = 'No Date', namePrefix, isCpgField = false }) => {
    const [noDateSelected, setNoDateSelected] = useState(false);
    const fieldName = namePrefix ? `${namePrefix}.${name}` : name;
    const [field, , { setValue }] = useField(fieldName);
    const { value } = field;
    const { values } = useFormikContext();
    const fieldStyles = useFieldStyles();
    const styles = useStyles();

    const toggleSelectNoDate = useCallback(() => {
      setValue(null);
      setNoDateSelected(currentValue => !currentValue);
    }, [setValue]);

    return (
      <div className={clsx(fieldStyles.field, styles.fieldCentered)}>
        {label && (
          <label htmlFor={fieldName} className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)}>
            <div>{label}</div>
            {isCpgField && (
              <div className={clsx(styles.cpgTag, isCpgComplete(name, values) && styles.cpgTagComplete)}>CPG</div>
            )}
            :
          </label>
        )}

        <div className={clsx(fieldStyles.fieldInput, styles.dateFieldInput)}>
          <DatePicker
            disabled={noDateSelected}
            onChange={(dateValue: Date | null) => {
              setValue(dateValue ? dateValue.toISOString().split('T')[0] : null);
            }}
            value={value ? new Date(value) : null}
          />
          {helperText && <div className={fieldStyles.helperText}>{helperText}</div>}
        </div>

        {noDateOption && (
          <div className={styles.fieldCheckbox}>
            <FormControlLabel
              control={<Checkbox checked={noDateSelected} color="primary" onChange={toggleSelectNoDate} />}
              label={noDateText}
            />
          </div>
        )}
      </div>
    );
  }
);

DateField.displayName = 'DateField';

export default DateField;
