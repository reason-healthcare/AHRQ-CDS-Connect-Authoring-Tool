import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, CircularProgress } from '@mui/material';
import clsx from 'clsx';

import { Dropdown } from 'components/elements';
import fetchConversionFunctions from 'queries/fetchConversionFunctions';
import type { ConversionFunction } from '../../../types/query';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

interface SelectModifierProps {
  handleUpdateModifier: (updates: { value: string; templateName: string; description: string }) => void;
  name: string;
  value?: string;
}

const SelectModifier: React.FC<SelectModifierProps> = ({ handleUpdateModifier, name, value }) => {
  const { data, error, isLoading, isSuccess } = useQuery<ConversionFunction[]>({
    queryKey: ['conversion_functions'],
    queryFn: () => fetchConversionFunctions()
  });
  const conversionFunctions = data ?? [];
  const options = conversionFunctions.map(option => ({
    value: option.id || option.name,
    label: option.description || option.id || option.name
  }));
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedOption = options.find(option => option.value === event.target.value);
    const optionValue = selectedOption ? selectedOption.value : '';
    const description = selectedOption ? selectedOption.label : '';
    handleUpdateModifier({ value: optionValue, templateName: optionValue, description });
  };

  return (
    <div className={styles.modifier}>
      {error && <Alert severity="error">{(error as Error).message}</Alert>}
      {isLoading && <CircularProgress />}

      {isSuccess && (
        <Dropdown
          className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputXl)}
          id="select-modifier"
          label={name}
          onChange={handleChange}
          options={options}
          value={value}
        />
      )}
    </div>
  );
};

export default SelectModifier;
