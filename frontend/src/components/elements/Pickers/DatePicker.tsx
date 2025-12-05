import React from 'react';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers';
import type { DatePickerProps as MuiDatePickerProps } from '@mui/x-date-pickers';

interface DatePickerProps extends Omit<MuiDatePickerProps<Date>, 'value' | 'onChange'> {
  disabled?: boolean;
  label?: string;
  onChange: (value: Date | null) => void;
  value?: Date | null;
}

const DatePicker: React.FC<DatePickerProps> = ({ disabled = false, label = 'Date', onChange, value }) => (
  <MuiDatePicker
    disabled={disabled}
    format="MM/dd/yyyy"
    label={label}
    onChange={onChange}
    slotProps={{
      textField: { variant: 'outlined' },
      openPickerButton: { 'aria-label': 'change date', sx: { height: '40px', width: '40px' } }
    }}
    value={value}
  />
);

export default DatePicker;
