import React from 'react';
import { Checkbox, FormControlLabel, TextField } from '@mui/material';
import clsx from 'clsx';

import { useFieldStyles, useFlexStyles } from 'styles/hooks';
import type { Field } from '../../../types/artifact';

interface NumberFieldProps {
  field: Field & { exclusive?: boolean };
  handleUpdateField: (update: Record<string, unknown>) => void;
  isInteger?: boolean | string;
}

const NumberField: React.FC<NumberFieldProps> = ({ field, handleUpdateField, isInteger = false }) => {
  const fieldStyles = useFieldStyles();
  const flexStyles = useFlexStyles();

  const handleChangeValue = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue =
      isInteger === 'integer' || isInteger === true ? parseInt(event.target.value, 10) : parseFloat(event.target.value);
    handleUpdateField({ [field.id]: newValue });
  };

  const handleChangeExclusive = (event: React.ChangeEvent<HTMLInputElement>): void => {
    handleUpdateField({ [field.id]: event.target.value });
  };

  return (
    <div className={flexStyles.flex} id="number-field">
      <TextField
        className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputMd)}
        fullWidth
        label={field.name}
        onChange={handleChangeValue}
        type="number"
        value={(field.value as number | string) || ''}
      />

      {field.exclusive && (
        <FormControlLabel
          className={fieldStyles.fieldInput}
          control={<Checkbox checked={field.exclusive || false} color="primary" onChange={handleChangeExclusive} />}
          label="Exclusive"
        />
      )}
    </div>
  );
};

export default NumberField;
