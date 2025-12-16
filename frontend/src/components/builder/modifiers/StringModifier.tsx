import React from 'react';
import { TextField } from '@mui/material';
import clsx from 'clsx';

import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

interface StringModifierProps {
  handleUpdateModifier: (updates: { value: string }) => void;
  name: string;
  value?: string;
}

const StringModifier: React.FC<StringModifierProps> = ({ handleUpdateModifier, name, value }) => {
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  return (
    <div className={styles.modifier}>
      <div className={styles.modifierText}>{name}:</div>

      <TextField
        className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputXl)}
        fullWidth
        label="Value"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleUpdateModifier({ value: event.target.value })}
        value={value || ''}
      />
    </div>
  );
};

export default StringModifier;
