import React from 'react';
import { Lock as LockIcon, NotInterested as NotInterestedIcon, VpnKey as VpnKeyIcon } from '@mui/icons-material';

import { useSpacingStyles } from 'styles/hooks';

interface ElementOptionProps {
  option: {
    label: string;
    value: string;
    vsacAuthRequired?: boolean;
    statementType?: string;
    arguments?: Array<{ name?: string; type?: string; [key: string]: string | number | boolean | undefined }>;
    displayReturnType?: string;
    hasEmptyList?: boolean;
    isVersionLocked?: boolean;
  };
}

const ElementOption: React.FC<ElementOptionProps> = ({ option }) => {
  const spacingStyles = useSpacingStyles();

  return (
    <>
      {option.label}
      {option.vsacAuthRequired && (
        <VpnKeyIcon className={spacingStyles.marginLeft} data-testid="vsac-auth-required-icon" fontSize="small" />
      )}
      {option.statementType === 'function' && <span>{` | Function(${option.arguments?.length || 0})`}</span>}
      {option.displayReturnType && <span>{` | ${option.displayReturnType}`}</span>}
      {option.hasEmptyList && <NotInterestedIcon className={spacingStyles.marginLeft} fontSize="small" />}
      {option.isVersionLocked && <LockIcon className={spacingStyles.marginLeft} fontSize="small" />}
    </>
  );
};

export default ElementOption;
