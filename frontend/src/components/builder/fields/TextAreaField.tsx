import React from 'react';
import { TextField } from '@mui/material';
import type { Field } from '../../../types/artifact';

interface TextAreaFieldProps {
  field: Field;
  handleUpdateField: (update: Record<string, string>) => void;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ field, handleUpdateField }) => (
  <TextField
    fullWidth
    hiddenLabel
    multiline
    inputProps={{ 'aria-label': field.name }}
    onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handleUpdateField({ [field.id]: event.target.value })
    }
    value={(field.value as string) || ''}
  />
);

export default TextAreaField;
