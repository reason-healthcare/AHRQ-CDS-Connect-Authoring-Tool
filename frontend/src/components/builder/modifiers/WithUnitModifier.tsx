import React from 'react';
import clsx from 'clsx';

import UcumField from 'components/builder/fields/UcumField';
import { useFieldStyles } from 'styles/hooks';
import useStyles from './styles';

interface WithUnitModifierProps {
  handleUpdateModifier: (updates: { unit: string }) => void;
  unit?: string;
}

const WithUnitModifier: React.FC<WithUnitModifierProps> = ({ handleUpdateModifier, unit }) => {
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  return (
    <div className={styles.modifier}>
      <div className={styles.modifierText}>With unit...</div>

      <div className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputMd)}>
        <UcumField
          handleChangeUnit={(
            event: React.SyntheticEvent,
            option: { value?: string; label?: string } | string | null
          ) => {
            let unitValue = '';
            if (typeof option === 'string') {
              unitValue = option;
            } else if (option && typeof option === 'object' && 'value' in option) {
              unitValue = option.value || '';
            }
            handleUpdateModifier({ unit: unitValue });
          }}
          unit={unit}
        />
      </div>
    </div>
  );
};

export default WithUnitModifier;
