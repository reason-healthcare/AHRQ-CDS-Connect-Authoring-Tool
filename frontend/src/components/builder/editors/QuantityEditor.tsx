import React from 'react';
import { Alert, Stack, TextField } from '@mui/material';
import { Remove as DashIcon } from '@mui/icons-material';

import UcumField from 'components/builder/fields/UcumField';
import { isInteger } from 'utils/numbers';
import { useFieldStyles } from 'styles/hooks';

interface QuantityEditorValue {
  quantity?: number | string;
  firstQuantity?: number | string | null;
  secondQuantity?: number | string | null;
  unit?: string;
  str?: string;
}

interface QuantityEditorErrors {
  invalidInput?: boolean;
  incompleteInput?: boolean;
}

interface QuantityEditorProps {
  errors?: QuantityEditorErrors;
  handleUpdateEditor: (value: QuantityEditorValue | null) => void;
  isInterval?: boolean;
  value?: QuantityEditorValue | string;
}

const QuantityEditor: React.FC<QuantityEditorProps> = ({ errors, handleUpdateEditor, isInterval, value }) => {
  const fieldStyles = useFieldStyles();

  const handleChange = (newValue: string | number, inputType: string): void => {
    // Skip numeric validation for unit changes
    if (inputType !== 'unit' && newValue && Number.isNaN(Number(newValue))) return;

    const unit = inputType === 'unit' ? (newValue as string) || '' : (value as QuantityEditorValue)?.unit || '';
    const escapedQuoteUnit = (unit ? unit.replace(/'/g, "\\'") : unit) || '1';

    if (isInterval) {
      const firstQuantity =
        inputType === 'firstQuantity'
          ? newValue && !Number.isNaN(Number(newValue))
            ? String(newValue)
            : null
          : (value as QuantityEditorValue)?.firstQuantity != null
            ? String((value as QuantityEditorValue).firstQuantity)
            : null;
      const secondQuantity =
        inputType === 'secondQuantity'
          ? newValue && !Number.isNaN(Number(newValue))
            ? String(newValue)
            : null
          : (value as QuantityEditorValue)?.secondQuantity != null
            ? String((value as QuantityEditorValue).secondQuantity)
            : null;
      const firstQuantityNum = firstQuantity ? Number(firstQuantity) : 0;
      const secondQuantityNum = secondQuantity ? Number(secondQuantity) : 0;
      // Only add .0 if the string doesn't already contain a decimal point
      const firstQuantityStr =
        firstQuantity != null
          ? `${firstQuantity}${!firstQuantity.includes('.') && isInteger(firstQuantityNum) ? '.0' : ''} '${escapedQuoteUnit}'`
          : null;
      const secondQuantityStr =
        secondQuantity != null
          ? `${secondQuantity}${!secondQuantity.includes('.') && isInteger(secondQuantityNum) ? '.0' : ''} '${escapedQuoteUnit}'`
          : null;
      const str = `Interval[${firstQuantityStr},${secondQuantityStr}]`;
      handleUpdateEditor(
        firstQuantity != null || secondQuantity != null || unit
          ? ({ firstQuantity, secondQuantity, unit, str } as QuantityEditorValue)
          : null
      );
    } else {
      const quantity =
        inputType === 'quantity'
          ? newValue && !Number.isNaN(Number(newValue))
            ? String(newValue)
            : ''
          : (value as QuantityEditorValue)?.quantity != null
            ? String((value as QuantityEditorValue).quantity)
            : '';
      const quantityNum = quantity ? Number(quantity) : 0;
      // Only add .0 if the string doesn't already contain a decimal point
      const str = `${quantity}${!quantity.includes('.') && isInteger(quantityNum) ? '.0' : ''} '${escapedQuoteUnit}'`;
      handleUpdateEditor(quantity || unit ? ({ quantity, unit, str } as QuantityEditorValue) : null);
    }
  };

  return (
    <Stack>
      <Stack alignItems="center" direction="row">
        <TextField
          fullWidth
          label="Value"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            handleChange(event.target.value, isInterval ? 'firstQuantity' : 'quantity')
          }
          sx={{ marginRight: '10px', width: { xs: '100px', xxl: '150px' } }}
          value={
            isInterval
              ? (value as QuantityEditorValue)?.firstQuantity || ''
              : (value as QuantityEditorValue)?.quantity || ''
          }
        />

        {isInterval && (
          <>
            <DashIcon className={fieldStyles.fieldInput} />

            <TextField
              fullWidth
              label="Value"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(event.target.value, 'secondQuantity')
              }
              sx={{ marginRight: '10px', width: { xs: '100px', xxl: '150px' } }}
              value={(value as QuantityEditorValue)?.secondQuantity || ''}
            />
          </>
        )}

        <UcumField
          handleChangeUnit={(
            event: React.SyntheticEvent,
            option: { value?: string; label?: string } | string | null
          ) => {
            let unitValue = '';
            if (typeof option === 'string') {
              unitValue = option;
            } else if (option && typeof option === 'object' && 'value' in option) {
              unitValue = option.value || '';
            }
            handleChange(unitValue, 'unit');
          }}
          unit={(value as QuantityEditorValue)?.unit || ''}
        />
      </Stack>

      {errors?.invalidInput && (
        <Alert severity="error">Warning: The Quantity's numerical value must be a valid Decimal.</Alert>
      )}

      {errors?.incompleteInput && (
        <Alert severity="error">Warning: A Quantity must have at least a numerical value.</Alert>
      )}
    </Stack>
  );
};

export default QuantityEditor;
