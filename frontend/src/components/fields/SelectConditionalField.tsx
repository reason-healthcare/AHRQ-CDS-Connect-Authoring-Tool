import React, { memo } from 'react';
import { useField } from 'formik';
import clsx from 'clsx';

import AutocompleteField from './AutocompleteField';
import useStyles from './styles';

interface FieldConfig {
  name: string;
  component: React.ComponentType<Record<string, string | number | boolean | null | undefined>>;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | React.ComponentType<Record<string, string | number | boolean | null | undefined>>;
}

interface SelectConditionalFieldConditions {
  [key: string]: FieldConfig[];
}

interface FastSelectConditionalFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  options: Array<{ label: string; value: string | number | null }>;
  conditions?: SelectConditionalFieldConditions;
  namePrefix?: string;
  currentValue: string | number | null;
}

const FastSelectConditionalField: React.FC<FastSelectConditionalFieldProps> = memo(
  ({ name, label, helperText, options, conditions, namePrefix, currentValue }) => {
    const styles = useStyles();

    return (
      <div className={clsx(styles.fieldGroup, styles.selectConditionField)}>
        <AutocompleteField name={name} label={label} options={options} helperText={helperText} />

        {currentValue &&
          conditions &&
          conditions[currentValue] &&
          conditions[currentValue].map((field, index) => {
            const FormComponent = field.component;
            // eslint-disable-next-line no-unused-vars
            const { component, ...fieldProps } = field;
            return (
              <FormComponent
                key={index}
                {...(fieldProps as Record<string, string | number | boolean | null | undefined>)}
                name={field.name}
                namePrefix={namePrefix}
              />
            );
          })}
      </div>
    );
  }
);

FastSelectConditionalField.displayName = 'FastSelectConditionalField';

interface SelectConditionalFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  options?: Array<{ label: string; value: string | number | null }>;
  conditions?: SelectConditionalFieldConditions;
  namePrefix?: string;
}

const SelectConditionalField: React.FC<SelectConditionalFieldProps> = memo(
  ({ name, label, helperText, options = [], conditions, namePrefix }) => {
    const fieldName = namePrefix ? `${namePrefix}.${name}` : name;
    const [field] = useField(fieldName);
    const currentValue = field.value;

    return (
      <FastSelectConditionalField
        name={fieldName}
        label={label}
        helperText={helperText}
        options={options}
        conditions={conditions}
        namePrefix={namePrefix}
        currentValue={currentValue}
      />
    );
  }
);

SelectConditionalField.displayName = 'SelectConditionalField';

export default SelectConditionalField;
