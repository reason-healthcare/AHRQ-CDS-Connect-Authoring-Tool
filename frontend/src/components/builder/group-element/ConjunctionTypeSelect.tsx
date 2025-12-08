import React from 'react';
import { Dropdown } from 'components/elements';

interface ConjunctionOption {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ConjunctionTypeSelectProps {
  editInstance: (type: ConjunctionOption) => void;
  name?: string;
  options: ConjunctionOption[];
}

const ConjunctionTypeSelect: React.FC<ConjunctionTypeSelectProps> = ({ editInstance, name, options }) => {
  const handleTypeChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    selectOptions: ConjunctionOption[]
  ) => {
    const type = selectOptions.find(option => option.name === event.target.value);
    if (type) {
      editInstance(type);
    }
  };

  return (
    <Dropdown
      id="conjunction-select"
      hiddenLabel={Boolean(name)}
      label={name ? null : 'Select one'}
      labelKey="name"
      onChange={event => handleTypeChange(event, options)}
      options={options as any}
      sx={{ margin: '20px 0', width: '12em' }}
      value={name || ''}
      valueKey="id"
    />
  );
};

export default ConjunctionTypeSelect;
