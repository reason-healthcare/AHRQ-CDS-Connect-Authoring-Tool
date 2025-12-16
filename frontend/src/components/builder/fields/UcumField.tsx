import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import fetchUnitsOfMeasure from 'queries/fetchUnitsOfMeasure';

interface UnitOfMeasure {
  value: string;
  label: string;
}

interface UcumFieldProps {
  handleChangeUnit: (event: React.SyntheticEvent, value: UnitOfMeasure | string | null) => void;
  unit?: string;
}

const UcumField: React.FC<UcumFieldProps> = ({ handleChangeUnit, unit }) => {
  const [ucumTerm, setUcumTerm] = useState<string>(unit || '');
  const query = { terms: ucumTerm };
  const { data: ucumOptions, isLoading } = useQuery<UnitOfMeasure[]>({
    queryKey: ['fetchUnitsOfMeasure', query],
    queryFn: () => fetchUnitsOfMeasure(query),
    enabled: Boolean(ucumTerm)
  });

  const handleChangeUcumTerm = (event: React.SyntheticEvent, term: string | null, reason: string): void => {
    if (reason === 'input' || reason === 'clear') setUcumTerm(term || '');
  };

  const getOptionLabel = (option: UnitOfMeasure | string): string => {
    if (typeof option === 'object' && option !== null && 'label' in option) {
      return option.label;
    }
    return String(option);
  };

  const isOptionEqualToValue = (option: UnitOfMeasure | string, value: UnitOfMeasure | string): boolean => {
    if (typeof option === 'object' && typeof value === 'object') {
      return option.value === value.value;
    }
    return option === value;
  };

  return (
    <Autocomplete
      freeSolo
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={isLoading}
      noOptionsText="Search..."
      onChange={handleChangeUnit}
      onInputChange={handleChangeUcumTerm}
      options={ucumOptions || []}
      popupIcon={<SearchIcon fontSize="small" />}
      renderInput={params => (
        <TextField
          {...params}
          label="Unit"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      sx={{ width: { xs: '200px', xxl: '300px' } }}
      value={unit || null}
    />
  );
};

export default UcumField;
