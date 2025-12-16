import React from 'react';
import clsx from 'clsx';

import { Dropdown } from 'components/elements';
import { DatePicker, TimePicker } from 'components/elements/Pickers';
import {
  convertDateForPicker,
  convertPickerDateToCQL,
  convertPickerTimeToCQL,
  convertTimeForPicker
} from 'utils/dates';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

const timePrecisionOptions = [
  { value: 'hour', label: 'hour' },
  { value: 'minute', label: 'minute' },
  { value: 'second', label: 'second' }
];

const dateTimePrecisionOptions = [
  { value: 'year', label: 'year' },
  { value: 'month', label: 'month' },
  { value: 'day', label: 'day' },
  { value: 'hour', label: 'hour' },
  { value: 'minute', label: 'minute' },
  { value: 'second', label: 'second' }
];

interface DateTimeModifierValues {
  date?: string | null;
  time?: string | null;
  precision?: string | null;
}

interface DateTimeModifierProps {
  handleUpdateModifier: (updates: DateTimeModifierValues) => void;
  name: string;
  values: DateTimeModifierValues;
}

const DateTimeModifier: React.FC<DateTimeModifierProps> = ({ handleUpdateModifier, name, values }) => {
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  const handleChange = (newValue: Date | string | null, inputType: string): void => {
    if (newValue && typeof newValue === 'object' && Number.isNaN(newValue.valueOf())) return;

    const newValues: DateTimeModifierValues = {};
    if (newValue != null) {
      newValues.date = inputType === 'date' ? `@${convertPickerDateToCQL(newValue as Date)}` : values?.date || null;
      newValues.time =
        inputType === 'time'
          ? `${!values.date ? '@' : ''}T${convertPickerTimeToCQL(newValue as Date)}`
          : values?.time || null;
      if (inputType === 'precision') newValues.precision = newValue as string;
    } else {
      (newValues as Record<string, null>)[inputType] = null;
    }

    handleUpdateModifier(newValues);
  };

  return (
    <div className={styles.modifier}>
      <div className={styles.modifierText}>{name}:</div>

      {values?.date != null && (
        <DatePicker
          onChange={(newValue: Date | null) => handleChange(newValue, 'date')}
          value={convertDateForPicker(values.date.replace(/^@/, ''))}
        />
      )}

      {values?.time != null && (
        <TimePicker
          onChange={(newValue: Date | null) => handleChange(newValue, 'time')}
          value={convertTimeForPicker(values.time.replace(/^@?T/, ''))}
        />
      )}

      {values.precision != null && (
        <div className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputMd)}>
          <Dropdown
            id="date-time-precision-modifier"
            label="Precision"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleChange(event.target.value, 'precision')}
            options={values.date != null ? dateTimePrecisionOptions : timePrecisionOptions}
            value={values.precision}
          />
        </div>
      )}
    </div>
  );
};

export default DateTimeModifier;
