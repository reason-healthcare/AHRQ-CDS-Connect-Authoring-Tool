import React from 'react';
import { IconButton, Stack, TextField } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';

interface RecommendationFieldProps {
  handleChangeField: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteField: () => void;
  label: string;
  placeholder: string;
  value: string;
}

const RecommendationField: React.FC<RecommendationFieldProps> = ({
  handleChangeField,
  handleDeleteField,
  label,
  placeholder,
  value
}) => (
  <Stack my={2}>
    <Stack alignItems="center" direction="row" justifyContent="space-between">
      {label}
      <IconButton aria-label="remove field" color="primary" onClick={handleDeleteField}>
        <ClearIcon fontSize="small" />
      </IconButton>
    </Stack>

    <TextField fullWidth hiddenLabel multiline onChange={handleChangeField} placeholder={placeholder} value={value} />
  </Stack>
);

export default RecommendationField;
