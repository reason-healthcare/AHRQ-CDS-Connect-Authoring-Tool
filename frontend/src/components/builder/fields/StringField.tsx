import React from 'react';
import { TextField } from '@mui/material';
import type { Field } from '../../../types/artifact';

interface StringFieldProps {
  field: Field;
  handleUpdateField: (update: Record<string, string>) => void;
  isDisabled?: boolean;
}

const StringField: React.FC<StringFieldProps> = ({ field, handleUpdateField, isDisabled = false }) => (
  <TextField
    disabled={isDisabled}
    fullWidth
    hiddenLabel
    inputProps={{ 'aria-label': field.name }}
    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
      handleUpdateField({ [field.id]: event.target.value })
    }
    value={(field.value as string) || ''}
  />
);

export default StringField;
