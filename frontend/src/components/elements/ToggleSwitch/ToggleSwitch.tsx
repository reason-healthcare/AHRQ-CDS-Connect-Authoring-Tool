import React from 'react';
import { Button } from '@mui/material';
import clsx from 'clsx';

import useStyles from './styles';

interface ToggleSwitchProps {
  className?: string;
  labels?: string[];
  onToggle: (label: string) => void;
  value: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ className, labels = ['and', 'or'], onToggle, value }) => {
  const styles = useStyles();

  const handleToggle = (labelToSelect: string): void => {
    if (value !== labelToSelect) onToggle(labelToSelect);
  };

  return (
    <div className={className || ''}>
      {labels.map(label => (
        <Button
          key={label}
          onClick={() => handleToggle(label)}
          className={clsx(styles.toggleButton, label === value && styles.active)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};

export default ToggleSwitch;
