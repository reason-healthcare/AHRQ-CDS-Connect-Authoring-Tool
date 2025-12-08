import React, { useCallback, useState } from 'react';
import { useLatest } from 'react-use';
import { Button, IconButton, TextField } from '@mui/material';
import { ArrowBackIos as ArrowBackIosIcon } from '@mui/icons-material';

import useStyles from '../styles';

interface ValueSet {
  name: string;
  oid: string;
}

interface ValueSetSelectModalHeaderProps {
  goBack: () => void;
  onSearch: (keyword: string | null) => void;
  readOnly: boolean;
  selectedValueSet: ValueSet | null;
}

const ValueSetSelectModalHeader: React.FC<ValueSetSelectModalHeaderProps> = ({
  goBack,
  onSearch,
  readOnly,
  selectedValueSet
}) => {
  const [searchValue, setSearchValue] = useState('');
  const searchValueRef = useLatest(searchValue);
  const styles = useStyles();

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  }, []);

  const handleSearch = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      onSearch(searchValueRef.current || null);
    },
    [searchValueRef, onSearch]
  );

  return (
    <div className={styles.searchContainer}>
      {!readOnly && selectedValueSet && (
        <div>
          <IconButton aria-label="Back" className={styles.iconButton} color="primary" onClick={goBack} size="large">
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>
        </div>
      )}

      <form onSubmit={handleSearch} className={styles.form}>
        <TextField
          className={styles.formInput}
          fullWidth
          InputProps={{ readOnly: readOnly || Boolean(selectedValueSet) }}
          label={selectedValueSet ? 'Value set' : 'Value set keyword'}
          onChange={handleChange}
          value={selectedValueSet ? `${selectedValueSet.name} (${selectedValueSet.oid})` : searchValue}
        />

        {!readOnly && !selectedValueSet && (
          <Button type="submit" color="primary" variant="contained">
            Search
          </Button>
        )}
      </form>
    </div>
  );
};

export default ValueSetSelectModalHeader;
