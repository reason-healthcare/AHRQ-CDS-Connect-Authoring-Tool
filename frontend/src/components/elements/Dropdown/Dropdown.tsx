import React, { memo } from 'react';
import { Divider, ListSubheader, MenuItem, TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

interface DropdownOption {
  label?: string;
  value: string | number;
  isSubheader?: boolean;
  isDisabled?: boolean;
  [key: string]: string | number | boolean | React.ReactNode | undefined;
}

interface DropdownProps extends Omit<TextFieldProps, 'select' | 'value' | 'onChange'> {
  Footer?: React.ReactElement | boolean;
  labelKey?: string;
  message?: React.ReactElement | boolean;
  options: Array<string | number | DropdownOption>;
  renderItem?: (option: DropdownOption) => React.ReactNode;
  value?: string | number;
  valueKey?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  Footer,
  labelKey = 'label',
  message,
  options,
  renderItem,
  value,
  valueKey = 'value',
  onChange,
  ...props
}) => {
  const dropdownOptions: DropdownOption[] = options.map(option =>
    typeof option === 'object' ? (option as DropdownOption) : { label: String(option), value: option }
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <div>
      <TextField autoComplete="off" fullWidth select value={value || ''} onChange={handleChange} {...props}>
        {dropdownOptions.map(option => {
          const optionValue = option[valueKey] as string | number;
          const optionLabel = (option[labelKey] as React.ReactNode) || String(optionValue);
          return option.isSubheader ? (
            <ListSubheader key={optionValue}>{renderItem ? renderItem(option) : optionLabel}</ListSubheader>
          ) : (
            <MenuItem
              key={optionValue}
              value={optionValue}
              disabled={option.isDisabled}
              onKeyDown={(event: React.KeyboardEvent<HTMLLIElement>) => {
                if (event.key === 'Tab' && onChange) {
                  const input = event.currentTarget
                    .closest('.MuiTextField-root')
                    ?.querySelector('input') as HTMLInputElement;
                  if (input) {
                    input.value = String(optionValue);
                    const syntheticEvent = {
                      target: input,
                      currentTarget: input
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleChange(syntheticEvent);
                  }
                }
              }}
            >
              {renderItem ? renderItem(option) : optionLabel}
            </MenuItem>
          );
        })}

        {Footer &&
          dropdownOptions.length > 0 && [
            <Divider key={0} />,
            <MenuItem key={1} value="-" disabled>
              {typeof Footer === 'boolean' ? null : Footer}
            </MenuItem>
          ]}

        {message && (
          <MenuItem value="-" disabled>
            {typeof message === 'boolean' ? null : message}
          </MenuItem>
        )}

        {dropdownOptions.length === 0 && (
          <MenuItem value="-" disabled>
            No options
          </MenuItem>
        )}
      </TextField>
    </div>
  );
};

export default memo(Dropdown);
