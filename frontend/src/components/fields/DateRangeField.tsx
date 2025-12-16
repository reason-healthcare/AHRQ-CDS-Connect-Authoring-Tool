import React, { memo, useCallback } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { Remove as DashIcon } from '@mui/icons-material';
import { useField, useFormikContext } from 'formik';
import clsx from 'clsx';

import { DatePicker } from 'components/elements/Pickers';
import { isCpgComplete } from 'utils/fields';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

interface DateRangePickerProps {
  fieldName: string;
  helperText?: string;
  name: string;
  rangeType: 'start' | 'end';
  noDateOption?: boolean;
  noDateText?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = memo(
  ({ fieldName, helperText, name, rangeType, noDateOption, noDateText }) => {
    const rangeFieldName = `${fieldName}.${rangeType}`;
    const [field, , { setValue }] = useField(rangeFieldName);
    const [noDateField, , { setValue: setNoDateFieldValue }] = useField(`${fieldName}.${rangeType}NoDate`);
    const { value } = field;
    const fieldStyles = useFieldStyles();
    const styles = useStyles();

    const toggleSelectNoDate = useCallback(() => {
      setNoDateFieldValue(!noDateField.value);
      setValue(null);
    }, [setNoDateFieldValue, setValue, noDateField.value]);

    return (
      <>
        <div className={fieldStyles.fieldInput}>
          <DatePicker
            disabled={noDateField.value}
            label={field.name === 'effectivePeriod.start' ? 'Start date' : 'End date'}
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
              control={<Checkbox checked={noDateField.value} color="primary" onChange={toggleSelectNoDate} />}
              label={noDateText}
            />
          </div>
        )}
      </>
    );
  }
);

DateRangePicker.displayName = 'DateRangePicker';

interface DateRangeFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  noDateOption?: boolean;
  namePrefix?: string;
  isCpgField?: boolean;
}

const DateRangeField: React.FC<DateRangeFieldProps> = memo(
  ({ name, label, helperText, noDateOption = false, namePrefix, isCpgField = false }) => {
    const fieldName = namePrefix ? `${namePrefix}.${name}` : name;
    const { values } = useFormikContext();
    const fieldStyles = useFieldStyles();
    const styles = useStyles();

    return (
      <div className={clsx(fieldStyles.field, styles.fieldCentered)}>
        {label && (
          <label htmlFor={fieldName} className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)}>
            {label}
            {isCpgField && (
              <div className={clsx(styles.cpgTag, isCpgComplete(name, values) && styles.cpgTagComplete)}>CPG</div>
            )}
            :
          </label>
        )}

        <div className={clsx(styles.fieldGroup, styles.dateFieldInput)}>
          <DateRangePicker
            fieldName={fieldName}
            name={name}
            noDateOption={noDateOption}
            noDateText="No Start Date"
            rangeType="start"
          />

          <div className={fieldStyles.fieldInput}>
            <DashIcon />
          </div>

          <DateRangePicker
            fieldName={fieldName}
            helperText={helperText}
            name={name}
            noDateOption={noDateOption}
            noDateText="No End Date"
            rangeType="end"
          />
        </div>
      </div>
    );
  }
);

DateRangeField.displayName = 'DateRangeField';

export default DateRangeField;
