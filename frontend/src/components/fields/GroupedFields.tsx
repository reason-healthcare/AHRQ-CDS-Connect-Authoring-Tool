import React, { memo, useCallback } from 'react';
// eslint-disable-next-line import/named
import { FieldArray, FieldArrayRenderProps } from 'formik';
import { Button, IconButton, Paper } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import clsx from 'clsx';

import { useFieldStyles } from 'styles/hooks';
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

interface FastGroupedFieldProps {
  name: string;
  index: number;
  remove: (index: number) => void;
  fields: FieldConfig[];
}

const FastGroupedField: React.FC<FastGroupedFieldProps> = memo(({ name, index, remove, fields }) => {
  const handleRemove = useCallback(() => remove(index), [remove, index]);
  const namePrefix = `${name}[${index}]`;
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  return (
    <Paper className={styles.fieldGroupContainer}>
      <div className={styles.fieldGroupCloseButton}>
        <IconButton aria-label="close" color="primary" onClick={handleRemove} size="large">
          <CloseIcon />
        </IconButton>
      </div>

      {fields.map(field => {
        const FormComponent = field.component;
        // eslint-disable-next-line no-unused-vars
        const { component, ...fieldProps } = field;

        return (
          <FormComponent
            className={fieldStyles.fieldInput}
            key={field.name}
            name={field.name}
            namePrefix={namePrefix}
            {...(fieldProps as Record<string, string | number | boolean | null | undefined>)}
          />
        );
      })}
    </Paper>
  );
});

FastGroupedField.displayName = 'FastGroupedField';

interface FastGroupedFieldArrayProps {
  name: string;
  label: string;
  buttonText: string;
  fields: FieldConfig[];
  values: Record<string, Array<Record<string, string | number | boolean | null | undefined>>>;
  defaultValue: Record<string, string | number | boolean | null | undefined>;
  push: (obj: Record<string, string | number | boolean | null | undefined>) => void;
  remove: (index: number) => void;
  isCpgField: boolean;
  isCpgComplete: (
    name: string,
    values: Record<string, Array<Record<string, string | number | boolean | null | undefined>>>
  ) => boolean;
}

const FastGroupedFieldArray: React.FC<FastGroupedFieldArrayProps> = memo(
  ({ name, label, buttonText, fields, values, defaultValue, push, remove, isCpgField, isCpgComplete }) => {
    const hasGroupedFields = values[name].length > 0;
    const addGroup = useCallback(() => push(defaultValue), [push, defaultValue]);
    const cpgFieldComplete = isCpgComplete(name, values);
    const fieldStyles = useFieldStyles();
    const styles = useStyles();

    return (
      <div className={clsx(fieldStyles.field, styles.groupedFields)}>
        <label htmlFor={name} className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)}>
          <div>{label}</div>
          {isCpgField && <div className={clsx(styles.cpgTag, cpgFieldComplete && styles.cpgTagComplete)}>CPG</div>}:
        </label>

        <div className={styles.fieldGroups}>
          {hasGroupedFields && (
            <div className={styles.fieldGroup}>
              {values[name].map(
                (_value: Record<string, string | number | boolean | null | undefined>, index: number) => (
                  <FastGroupedField name={name} key={index} index={index} remove={remove} fields={fields} />
                )
              )}
            </div>
          )}

          <div className={fieldStyles.fieldInput}>
            <Button color="primary" onClick={addGroup} startIcon={<AddIcon />} variant="contained">
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

FastGroupedFieldArray.displayName = 'FastGroupedFieldArray';

interface GroupedFieldsProps {
  name: string;
  label: string;
  buttonText?: string;
  fields?: FieldConfig[];
  defaultValue?: Record<string, string | number | boolean | null | undefined>;
  isCpgField?: boolean;
  isCpgComplete?: (
    name: string,
    values: Record<string, Array<Record<string, string | number | boolean | null | undefined>>>
  ) => boolean;
}

const GroupedFields: React.FC<GroupedFieldsProps> = memo(
  ({ name, label, buttonText = 'Add', fields = [], defaultValue = {}, isCpgField = false, isCpgComplete }) => {
    return (
      <FieldArray
        name={name}
        render={({ push, remove, form }: FieldArrayRenderProps) => (
          <FastGroupedFieldArray
            name={name}
            label={label}
            buttonText={buttonText}
            fields={fields}
            values={form.values}
            push={push}
            remove={remove}
            defaultValue={defaultValue}
            isCpgField={isCpgField}
            isCpgComplete={isCpgComplete || (() => false)}
          />
        )}
      />
    );
  }
);

GroupedFields.displayName = 'GroupedFields';

export default GroupedFields;
