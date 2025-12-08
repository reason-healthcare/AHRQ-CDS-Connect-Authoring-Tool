import React from 'react';
import { Alert, Stack, TextField } from '@mui/material';
import { Remove as DashIcon } from '@mui/icons-material';

import { isInteger } from 'utils/numbers';

interface NumberEditorValue {
  firstDecimal?: number | string;
  firstInteger?: number | string;
  secondDecimal?: number | string;
  secondInteger?: number | string;
  decimal?: number | string;
  str?: string;
}

interface NumberEditorErrors {
  invalidInput?: boolean;
}

interface NumberEditorProps {
  errors?: NumberEditorErrors;
  handleUpdateEditor: (value: NumberEditorValue | number | string | null) => void;
  isDecimal?: boolean;
  isInterval?: boolean;
  label?: string;
  value?: NumberEditorValue | string | number;
}

const NumberEditor: React.FC<NumberEditorProps> = ({
  errors,
  handleUpdateEditor,
  isDecimal = false,
  isInterval = false,
  label = 'Value',
  value
}) => {
  let firstValue: string | number = value && typeof value !== 'object' ? value : '';
  if (isInterval && isDecimal && typeof value === 'object' && value !== null) {
    firstValue = (value as NumberEditorValue).firstDecimal || '';
  }
  if (isInterval && !isDecimal && typeof value === 'object' && value !== null) {
    firstValue = (value as NumberEditorValue).firstInteger || '';
  }
  if (!isInterval && isDecimal && typeof value === 'object' && value !== null) {
    firstValue = (value as NumberEditorValue).decimal || '';
  }
  const secondValue =
    isDecimal && typeof value === 'object' && value !== null
      ? (value as NumberEditorValue).secondDecimal || ''
      : typeof value === 'object' && value !== null
        ? (value as NumberEditorValue).secondInteger || ''
        : '';

  const handleChange = (newValue: string, inputType: string | null): void => {
    const numValue = parseFloat(newValue);
    if (newValue && Number.isNaN(numValue)) return;

    if (isInterval) {
      if (isDecimal) {
        const firstDecimal =
          inputType === 'firstDecimal'
            ? newValue && !Number.isNaN(numValue)
              ? newValue.trim()
              : null
            : (value as NumberEditorValue)?.firstDecimal != null
              ? String((value as NumberEditorValue).firstDecimal)
              : null;
        const secondDecimal =
          inputType === 'secondDecimal'
            ? newValue && !Number.isNaN(numValue)
              ? newValue.trim()
              : null
            : (value as NumberEditorValue)?.secondDecimal != null
              ? String((value as NumberEditorValue).secondDecimal)
              : null;
        // Check if the string already contains a decimal point before adding .0
        const firstDecimalStr = firstDecimal
          ? `${firstDecimal}${!firstDecimal.includes('.') && isInteger(firstDecimal) ? '.0' : ''}`
          : null;
        const secondDecimalStr = secondDecimal
          ? `${secondDecimal}${!secondDecimal.includes('.') && isInteger(secondDecimal) ? '.0' : ''}`
          : null;
        const str = `Interval[${firstDecimalStr},${secondDecimalStr}]`;
        handleUpdateEditor(
          firstDecimal != null || secondDecimal != null
            ? ({ firstDecimal, secondDecimal, str } as NumberEditorValue)
            : null
        );
      } else {
        const firstInteger =
          inputType === 'firstInteger'
            ? newValue && !Number.isNaN(numValue)
              ? String(numValue)
              : null
            : (value as NumberEditorValue)?.firstInteger != null
              ? String((value as NumberEditorValue).firstInteger)
              : null;
        const secondInteger =
          inputType === 'secondInteger'
            ? newValue && !Number.isNaN(numValue)
              ? String(numValue)
              : null
            : (value as NumberEditorValue)?.secondInteger != null
              ? String((value as NumberEditorValue).secondInteger)
              : null;
        const str = `Interval[${firstInteger},${secondInteger}]`;
        handleUpdateEditor(
          firstInteger != null || secondInteger != null
            ? ({ firstInteger, secondInteger, str } as NumberEditorValue)
            : null
        );
      }
    } else {
      if (isDecimal) {
        if (newValue && !Number.isNaN(numValue)) {
          // Preserve the original string format for decimals (e.g., '0.0', '0.000')
          const decimalStr = newValue.trim();
          // Only add .0 if the string doesn't already contain a decimal point
          const str = !decimalStr.includes('.') && isInteger(decimalStr) ? `${decimalStr}.0` : decimalStr;
          handleUpdateEditor({
            decimal: decimalStr,
            str
          });
        } else {
          handleUpdateEditor(null);
        }
      } else {
        if (newValue && !Number.isNaN(numValue)) {
          handleUpdateEditor(String(numValue));
        } else {
          handleUpdateEditor(null);
        }
      }
    }
  };

  return (
    <Stack>
      <Stack alignItems="center" direction="row">
        <TextField
          fullWidth
          label={label}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            handleChange(event.target.value, isInterval ? (isDecimal ? 'firstDecimal' : 'firstInteger') : null)
          }
          sx={{ width: { xs: '150px', xxl: '200px' } }}
          type="number"
          value={firstValue}
        />

        {isInterval && (
          <>
            <DashIcon sx={{ margin: '0 10px' }} />

            <TextField
              fullWidth
              label="Value"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(event.target.value, isInterval ? (isDecimal ? 'secondDecimal' : 'secondInteger') : null)
              }
              sx={{ width: { xs: '150px', xxl: '200px' } }}
              type="number"
              value={secondValue}
            />
          </>
        )}
      </Stack>

      {errors?.invalidInput && (
        <Alert severity="error">Warning: The entered value is not a valid {isDecimal ? 'Decimal' : 'Integer'}.</Alert>
      )}
    </Stack>
  );
};

export default NumberEditor;
