import React from 'react';
import { TextField } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

interface MultipleSelectOption {
  inputValue?: string;
  [key: string]: unknown;
}

type OptionType = MultipleSelectOption | string;

interface MultipleSelectProps {
  allowCustomInput?: boolean;
  label: string;
  onChange: (value: OptionType[]) => void;
  options: OptionType[];
  value?: OptionType[];
  [key: string]: unknown;
}

const MultipleSelect: React.FC<MultipleSelectProps> = ({
  allowCustomInput = false,
  label,
  onChange,
  options,
  value,
  ...props
}) => {
  const filter = createFilterOptions<OptionType>();

  const filterOptions = (optionsToFilter: OptionType[], params: { inputValue: string }): OptionType[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = (filter as any)(optionsToFilter, params) as OptionType[];

    // Suggest the creation of a new value
    if (allowCustomInput && params.inputValue !== '') {
      filtered.push({ inputValue: params.inputValue } as OptionType);
    }

    return filtered;
  };

  const getOptionLabel = (option: OptionType): string => {
    if (typeof option === 'object' && option !== null && 'inputValue' in option) {
      return (option as MultipleSelectOption).inputValue || '';
    }
    return String(option);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: OptionType[]): void => {
    onChange(newValue);
  };

  return (
    <Autocomplete
      autoSelect
      autoHighlight
      filterOptions={filterOptions}
      freeSolo={allowCustomInput}
      fullWidth
      getOptionLabel={getOptionLabel}
      multiple
      onChange={handleChange}
      options={options}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={allowCustomInput ? 'Select or type custom option...' : 'Select...'}
        />
      )}
      value={value || []}
      {...props}
    />
  );
};

export default MultipleSelect;
