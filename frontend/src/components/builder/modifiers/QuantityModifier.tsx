import React from 'react';
import { TextField } from '@mui/material';
import clsx from 'clsx';

import UcumField from 'components/builder/fields/UcumField';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

interface QuantityModifierProps {
  handleUpdateModifier: (updates: { value: number | string; unit: string }) => void;
  name: string;
  unit?: string;
  value?: number;
}

const QuantityModifier: React.FC<QuantityModifierProps> = ({ handleUpdateModifier, name, unit, value }) => {
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  const handleChange = (newValue: string | number, inputType: string): void => {
    const newQuantity = inputType === 'quantity' ? parseFloat(String(newValue)) : value || '';
    const newUnit = inputType === 'unit' ? (newValue as string) || '' : unit || '';

    handleUpdateModifier({ value: newQuantity, unit: newUnit });
  };

  return (
    <div className={styles.modifier}>
      <div className={styles.modifierText}>{name}:</div>

      <TextField
        className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputXs)}
        fullWidth
        label="Value"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleChange(event.target.value, 'quantity')}
        value={value || value === 0 ? value : ''}
        id="quantity-modifier"
      />

      <div className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputLg)}>
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
          unit={unit || ''}
        />
      </div>
    </div>
  );
};

export default QuantityModifier;
