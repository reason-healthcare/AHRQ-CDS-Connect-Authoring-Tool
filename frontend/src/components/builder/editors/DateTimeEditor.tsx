import React from 'react';
import { Alert, Box, Stack } from '@mui/material';
import { Remove as DashIcon } from '@mui/icons-material';

import { DatePicker, TimePicker } from 'components/elements/Pickers';
import {
  convertDateForPicker,
  convertTimeForPicker,
  convertPickerDateToCQL,
  convertPickerTimeToCQL
} from 'utils/dates';

interface DateTimeEditorValue {
  date?: string | null;
  time?: string | null;
  firstDate?: string | null;
  firstTime?: string | null;
  secondDate?: string | null;
  secondTime?: string | null;
  str?: string;
}

interface DateTimeEditorErrors {
  incompleteInput?: boolean;
}

interface DateTimeEditorProps {
  errors?: DateTimeEditorErrors;
  fullWidth?: boolean;
  handleUpdateEditor: (value: DateTimeEditorValue | null) => void;
  isInterval?: boolean;
  isTime?: boolean;
  value?: DateTimeEditorValue;
}

const convertDateTimeForCQL = (
  newValues: {
    date?: string | null;
    time?: string | null;
    firstDate?: string | null;
    firstTime?: string | null;
    secondDate?: string | null;
    secondTime?: string | null;
  },
  isInterval: boolean,
  isTime: boolean
): DateTimeEditorValue | null => {
  const { date, time, firstDate, firstTime, secondDate, secondTime } = newValues;
  if (isInterval) {
    const firstDateTime = firstDate ? (firstTime ? `@${firstDate}T${firstTime}` : `@${firstDate}`) : null;
    const secondDateTime = secondDate ? (secondTime ? `@${secondDate}T${secondTime}` : `@${secondDate}`) : null;
    return firstDate || firstTime || secondDate || secondTime
      ? { firstDate, firstTime, secondDate, secondTime, str: `Interval[${firstDateTime},${secondDateTime}]` }
      : null;
  }
  if (isTime) return time ? { time, str: `@T${time}` } : null;
  return date || time ? { date, time, str: date ? (time ? `@${date}T${time}` : `@${date}`) : null } : null;
};

const DateTimeEditor: React.FC<DateTimeEditorProps> = ({
  errors,
  fullWidth = true,
  handleUpdateEditor,
  isInterval = false,
  isTime = false,
  value
}) => {
  const handleChange = (newValue: Date | null, inputType: string): void => {
    if (newValue && Number.isNaN(newValue.valueOf())) return;

    let newValues: {
      date?: string | null;
      time?: string | null;
      firstDate?: string | null;
      firstTime?: string | null;
      secondDate?: string | null;
      secondTime?: string | null;
    } = {};
    if (isInterval) {
      newValues.firstDate = inputType === 'firstDate' ? convertPickerDateToCQL(newValue) : value?.firstDate || null;
      newValues.firstTime = inputType === 'firstTime' ? convertPickerTimeToCQL(newValue) : value?.firstTime || null;
      newValues.secondDate = inputType === 'secondDate' ? convertPickerDateToCQL(newValue) : value?.secondDate || null;
      newValues.secondTime = inputType === 'secondTime' ? convertPickerTimeToCQL(newValue) : value?.secondTime || null;
    } else {
      newValues.date = inputType === 'date' ? convertPickerDateToCQL(newValue) : value?.date || null;
      newValues.time = inputType === 'time' ? convertPickerTimeToCQL(newValue) : value?.time || null;
    }

    handleUpdateEditor(convertDateTimeForCQL(newValues, isInterval, isTime));
  };

  return (
    <Stack sx={{ width: fullWidth ? '100%' : { xs: '300px', xxl: '400px' } }}>
      <Stack direction="row">
        {!isTime && (
          <Box mr={2}>
            <DatePicker
              onChange={(newValue: Date | null) => handleChange(newValue, isInterval ? 'firstDate' : 'date')}
              value={convertDateForPicker(isInterval ? value?.firstDate : value?.date)}
            />
          </Box>
        )}

        <TimePicker
          onChange={(newValue: Date | null) => handleChange(newValue, isInterval ? 'firstTime' : 'time')}
          value={convertTimeForPicker(isInterval ? value?.firstTime : value?.time)}
        />

        {isInterval && <DashIcon />}
      </Stack>

      {isInterval && (
        <Stack direction="row">
          {!isTime && (
            <DatePicker
              onChange={(newValue: Date | null) => handleChange(newValue, 'secondDate')}
              value={convertDateForPicker(value?.secondDate)}
            />
          )}

          <TimePicker
            onChange={(newValue: Date | null) => handleChange(newValue, 'secondTime')}
            value={convertTimeForPicker(value?.secondTime)}
          />
        </Stack>
      )}

      {errors?.incompleteInput && <Alert severity="error">Warning: A DateTime must have at least a date.</Alert>}
    </Stack>
  );
};

export default DateTimeEditor;
