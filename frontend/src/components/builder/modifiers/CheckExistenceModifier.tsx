import React from 'react';
import clsx from 'clsx';

import { Dropdown } from 'components/elements';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

const options = [
  { value: 'is null', label: 'is null' },
  { value: 'is not null', label: 'is not null' }
];

interface CheckExistenceModifierProps {
  handleUpdateModifier: (updates: { value: string }) => void;
  value?: string;
}

const CheckExistenceModifier: React.FC<CheckExistenceModifierProps> = ({ handleUpdateModifier, value }) => {
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  return (
    <div className={styles.modifier}>
      <Dropdown
        className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputMd)}
        id="check-existence"
        label="Check existence"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleUpdateModifier({ value: event.target.value })}
        options={options}
        value={value}
      />
    </div>
  );
};

export default CheckExistenceModifier;
