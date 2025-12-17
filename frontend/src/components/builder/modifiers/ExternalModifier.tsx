import React, { useEffect } from 'react';
import { MenuBook as MenuBookIcon } from '@mui/icons-material';
import clsx from 'clsx';
import _ from 'lodash';

import { ArgumentsTemplate } from 'components/builder/templates';
import { useSpacingStyles } from 'styles/hooks';
import useStyles from './styles';

export interface ModifierArgument {
  name: string;
  [key: string]: unknown;
}

export interface ArgumentType {
  calculated: string;
  [key: string]: unknown;
}

interface ExternalModifierProps {
  argumentTypes: ArgumentType[];
  handleUpdateModifier: (updates: { value: unknown[] }) => void;
  modifierArguments: ModifierArgument[];
  name: string;
  values?: unknown[];
}

const ExternalModifier: React.FC<ExternalModifierProps> = ({
  argumentTypes,
  handleUpdateModifier,
  modifierArguments,
  name,
  values
}) => {
  const spacingStyles = useSpacingStyles();
  const styles = useStyles();

  const assignValue = (newValue: unknown, argIndex: number): void => {
    const updatedValues = _.cloneDeep(values || []);
    updatedValues[argIndex] = newValue;
    handleUpdateModifier({ value: updatedValues });
  };

  useEffect(() => {
    if (!values || values.length === 0) {
      handleUpdateModifier({ value: new Array(modifierArguments.length).fill(null) });
    }
  }, [handleUpdateModifier, modifierArguments.length, values]);

  return (
    <div key={name} className={styles.modifier}>
      <div className={styles.modifierHeader}>
        <MenuBookIcon fontSize="small" />
        {name}
      </div>

      <div className={clsx(spacingStyles.indent, spacingStyles.fullWidth)} data-testid="editors">
        {modifierArguments.length > 1 &&
          modifierArguments.map((modifierArg, argIndex) => {
            // We don't want the modifier input arguments to include the first function argument
            if (argIndex === 0) return null;

            return (
              <ArgumentsTemplate
                key={argIndex}
                argumentLabel={modifierArg.name}
                argumentType={argumentTypes[argIndex]?.calculated || ''}
                argumentValue={values?.[argIndex] as Record<string, unknown> | undefined}
                handleUpdateArgument={(newValue: unknown) => assignValue(newValue, argIndex)}
                isNested
              />
            );
          })}
      </div>
    </div>
  );
};

export default ExternalModifier;
