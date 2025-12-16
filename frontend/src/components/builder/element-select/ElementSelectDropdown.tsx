import React, { useMemo } from 'react';
import { Alert } from '@mui/material';
import { Lock as LockIcon, NotInterested as NotInterestedIcon, VpnKey as VpnKeyIcon } from '@mui/icons-material';
import _ from 'lodash';

import ElementOption from './ElementOption';
import { Dropdown } from 'components/elements';
import { useSpacingStyles } from 'styles/hooks';

type DropdownOption = {
  label?: string;
  value: string | number;
  isSubheader?: boolean;
  isDisabled?: boolean;
  [key: string]: string | number | boolean | React.ReactNode | undefined;
};

interface ElementSelectOption {
  label: string;
  value: string;
  hasEmptyList?: boolean;
  isVersionLocked?: boolean;
  vsacAuthRequired?: boolean;
  statementType?: string;
  arguments?: Array<{ name?: string; type?: string; [key: string]: string | number | boolean | undefined }>;
  displayReturnType?: string;
  options?: ElementSelectOption[];
  [key: string]:
    | string
    | number
    | boolean
    | React.ReactNode
    | ElementSelectOption[]
    | Array<{ name?: string; type?: string; [key: string]: string | number | boolean | undefined }>
    | undefined;
}

type DropdownOptionType = {
  label?: string;
  value: string | number;
  isSubheader?: boolean;
  isDisabled?: boolean;
  [key: string]: string | number | boolean | React.ReactNode | undefined;
};

interface ElementSelectDropdownProps {
  handleSelectOption: (value: string) => void;
  isDisabled?: boolean;
  label: string;
  options: Array<string | number | DropdownOptionType | ElementSelectOption>;
  showFooter?: boolean;
  value: string;
}

const ElementSelectDropdown: React.FC<ElementSelectDropdownProps> = ({
  handleSelectOption,
  isDisabled,
  label,
  options,
  showFooter,
  value
}) => {
  const spacingStyles = useSpacingStyles();
  const dropdownId = useMemo(() => _.uniqueId('element-select-'), []);

  return (
    <Dropdown
      id={dropdownId}
      Footer={
        showFooter && (
          <div>
            {options.some(option => typeof option === 'object' && 'hasEmptyList' in option && option.hasEmptyList) && (
              <div>
                <NotInterestedIcon className={spacingStyles.marginRight} fontSize="small" />
                No named options to select
              </div>
            )}

            {options.some(
              option => typeof option === 'object' && 'isVersionLocked' in option && option.isVersionLocked
            ) && (
              <div>
                <LockIcon className={spacingStyles.marginRight} fontSize="small" />
                Version locked
              </div>
            )}

            <div>
              <VpnKeyIcon className={spacingStyles.marginRight} fontSize="small" />
              VSAC authentication required
            </div>
          </div>
        )
      }
      label={label}
      message={
        isDisabled ? <Alert severity="error">Cannot add element when Base Element List in use.</Alert> : undefined
      }
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSelectOption(event.target.value)}
      options={isDisabled ? [] : (options as Array<string | number | DropdownOption>)}
      renderItem={(option: DropdownOption) => <ElementOption option={option as ElementSelectOption} />}
      sx={{ width: '400px' }}
      value={value}
    />
  );
};

export default ElementSelectDropdown;
