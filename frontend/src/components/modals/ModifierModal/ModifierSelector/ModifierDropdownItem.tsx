import React from 'react';
import { MenuBook as MenuBookIcon } from '@mui/icons-material';

interface ModifierDropdownItemProps {
  option: {
    isExternal?: boolean;
    label: string;
    value: string;
    [key: string]: unknown;
  };
}

const ModifierDropdownItem: React.FC<ModifierDropdownItemProps> = ({ option }) => {
  return (
    <>
      {option.isExternal && <MenuBookIcon fontSize="small" style={{ marginRight: '5px' }} />}
      {option.label}
    </>
  );
};

export default ModifierDropdownItem;
