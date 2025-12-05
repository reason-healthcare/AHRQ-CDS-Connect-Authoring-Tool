import React from 'react';

import { Dropdown } from 'components/elements';

const options = [
  { value: 'true', label: 'True' },
  { value: 'false', label: 'False' }
];

interface BooleanEditorProps {
  handleUpdateEditor: (value: string) => void;
  value?: string;
}

const BooleanEditor: React.FC<BooleanEditorProps> = ({ handleUpdateEditor, value }) => (
  <Dropdown
    label={value ? 'Boolean value' : 'Select...'}
    onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleUpdateEditor(event.target.value)}
    options={options}
    sx={{ width: { xs: '100px', xxl: '200px' } }}
    value={value}
  />
);

export default BooleanEditor;
