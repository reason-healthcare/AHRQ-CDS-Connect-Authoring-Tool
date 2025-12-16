import React from 'react';
import { Autocomplete, Stack, TextField } from '@mui/material';

import UcumField from 'components/builder/fields/UcumField';

const options = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' }
];

interface ValueComparisonModifierValues {
  maxOperator?: string | null;
  maxValue?: number | string;
  minOperator?: string | null;
  minValue?: number | string;
  unit?: string | null;
}

interface ValueComparisonModifierProps {
  handleUpdateModifier: (updates: Partial<ValueComparisonModifierValues>) => void;
  values: ValueComparisonModifierValues;
}

const ValueComparisonModifier: React.FC<ValueComparisonModifierProps> = ({ handleUpdateModifier, values }) => (
  <Stack direction="row" flexWrap="wrap" py={1} width="100%">
    <Autocomplete
      autoSelect
      autoHighlight
      getOptionLabel={(option: { value?: string; label?: string } | string) =>
        typeof option === 'object' && option !== null && 'label' in option ? option.label || '' : ''
      }
      id="value-comparison-modifier-minop"
      onChange={(event: React.SyntheticEvent, option: { value?: string; label?: string } | null) =>
        handleUpdateModifier({
          minOperator: option && typeof option === 'object' && 'value' in option ? option.value || null : null
        })
      }
      options={options}
      renderInput={params => <TextField {...params} label="minOp" />}
      sx={{ marginRight: '10px', width: { xs: '100px', xxl: '150px' } }}
      value={options.find(option => option.value === values.minOperator) || null}
    />

    <TextField
      id="value-comparison-modifier-minvalue"
      label="minValue"
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(event.target.value);
        handleUpdateModifier({ minValue: Number.isNaN(newValue) ? '' : newValue });
      }}
      type="number"
      value={values.minValue || values.minValue === 0 ? values.minValue : ''}
      sx={{ marginRight: '10px', width: { xs: '100px', xxl: '150px' } }}
    />

    <Autocomplete
      autoSelect
      autoHighlight
      getOptionLabel={(option: { value?: string; label?: string } | string) =>
        typeof option === 'object' && option !== null && 'value' in option ? option.value || '' : ''
      }
      id="value-comparison-modifier-maxop"
      onChange={(event: React.SyntheticEvent, option: { value?: string; label?: string } | null) =>
        handleUpdateModifier({
          maxOperator: option && typeof option === 'object' && 'value' in option ? option.value || null : null
        })
      }
      options={options}
      renderInput={params => <TextField {...params} label="maxOp" />}
      sx={{ marginRight: '10px', width: { xs: '100px', xxl: '150px' } }}
      value={options.find(option => option.value === values.maxOperator) || null}
    />

    <TextField
      id="value-comparison-modifier-maxvalue"
      label="maxValue"
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(event.target.value);
        handleUpdateModifier({ maxValue: Number.isNaN(newValue) ? '' : newValue });
      }}
      sx={{ marginRight: '10px', width: { xs: '100px', xxl: '150px' } }}
      type="number"
      value={values.maxValue || values.maxValue === 0 ? values.maxValue : ''}
    />

    {values.unit != null && (
      <UcumField
        handleChangeUnit={(event: React.SyntheticEvent, option: { value?: string; label?: string } | string | null) => {
          let unitValue: string | null = null;
          if (typeof option === 'string') {
            unitValue = option;
          } else if (option && typeof option === 'object' && 'value' in option) {
            unitValue = option.value || null;
          }
          handleUpdateModifier({ unit: unitValue });
        }}
        unit={values.unit}
      />
    )}
  </Stack>
);

export default ValueComparisonModifier;
