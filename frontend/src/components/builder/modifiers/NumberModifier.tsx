import React from 'react';
import { TextField } from '@mui/material';
import clsx from 'clsx';

import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

interface NumberModifierProps {
  handleUpdateModifier: (updates: { value: string }) => void;
  name: string;
  value?: string | number;
}

const NumberModifier: React.FC<NumberModifierProps> = ({ handleUpdateModifier, name, value }) => {
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  const handleOnChange = (newValue: string): void => {
    const needsLeadingZero = newValue.startsWith('.') || newValue.startsWith('-.');
    handleUpdateModifier({ value: needsLeadingZero ? newValue.replace('.', '0.') : newValue });
  };

  return (
    <div className={styles.modifier}>
      <div className={styles.modifierText}>{name}:</div>

      <TextField
        className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputXs)}
        fullWidth
        label="Value"
        type="number"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleOnChange(event.target.value)}
        value={value || value === 0 ? value : ''}
      />
    </div>
  );
};

export default NumberModifier;
