import React from 'react';
import { TimePicker as MuiTimePicker } from '@mui/x-date-pickers';
import { Schedule as TimeIcon } from '@mui/icons-material';
import type { TimePickerProps as MuiTimePickerProps } from '@mui/x-date-pickers';

interface TimePickerProps extends Omit<MuiTimePickerProps<Date>, 'value' | 'onChange'> {
  onChange: (value: Date | null) => void;
  value?: Date | null;
}

const TimePicker: React.FC<TimePickerProps> = ({ onChange, value }) => (
  <MuiTimePicker
    format="HH:mm:ss"
    label="Time"
    onChange={onChange}
    slotProps={{
      textField: { variant: 'outlined' },
      openPickerButton: { 'aria-label': 'change time', sx: { height: '40px', width: '40px' } }
    }}
    slots={{
      openPickerIcon: TimeIcon
    }}
    value={value}
    views={['hours', 'minutes', 'seconds']}
  />
);

export default TimePicker;
