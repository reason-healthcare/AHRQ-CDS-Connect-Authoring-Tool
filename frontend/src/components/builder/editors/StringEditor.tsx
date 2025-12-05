import React from 'react';
import { TextField } from '@mui/material';

interface StringEditorProps {
  handleUpdateEditor: (value: string | null) => void;
  value?: string;
}

const StringEditor: React.FC<StringEditorProps> = ({ handleUpdateEditor, value }) => (
  <TextField
    fullWidth
    label="Value"
    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
      handleUpdateEditor(event.target.value ? `'${event.target.value}'` : null)
    }
    sx={{ width: { xs: '400px', xxl: '600px' } }}
    value={value ? value.replace(/'/g, '') : ''}
  />
);

export default StringEditor;
