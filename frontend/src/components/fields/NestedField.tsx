import React, { memo } from 'react';
// eslint-disable-next-line import/named
import { Field, FieldProps } from 'formik';
import { Paper } from '@mui/material';
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

interface FastNestedProps {
  name: string;
  fields: FieldConfig[];
}

const FastNested: React.FC<FastNestedProps> = memo(({ name, fields }) => {
  const fieldStyles = useFieldStyles();
  const styles = useStyles();

  return (
    <Paper className={styles.fieldGroupContainer}>
      {fields.map(field => {
        const FormComponent = field.component;

        return (
          <FormComponent
            className={fieldStyles.fieldInput}
            key={field.name}
            name={field.name}
            namePrefix={name}
            {...field}
          />
        );
      })}
    </Paper>
  );
});

FastNested.displayName = 'FastNested';

interface FastNestedFieldProps {
  name: string;
  label: string;
  fields: FieldConfig[];
  values: Record<
    string,
    string | number | boolean | null | undefined | Record<string, string | number | boolean | null | undefined>[]
  >;
  isCpgField: boolean;
  isCpgComplete?: (
    name: string,
    values: Record<
      string,
      string | number | boolean | null | undefined | Record<string, string | number | boolean | null | undefined>[]
    >
  ) => boolean;
}

const FastNestedField: React.FC<FastNestedFieldProps> = memo(
  ({ name, label, fields, values, isCpgField, isCpgComplete }) => {
    const cpgFieldComplete = (isCpgComplete || (() => false))(name, values);
    const fieldStyles = useFieldStyles();
    const styles = useStyles();

    return (
      <div className={clsx(fieldStyles.field, styles.groupedFields)}>
        <label htmlFor={name} className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)}>
          <div>{label}</div>
          {isCpgField && <div className={clsx(styles.cpgTag, cpgFieldComplete && styles.cpgTagComplete)}>CPG</div>}:
        </label>

        <FastNested name={name} fields={fields} />
      </div>
    );
  }
);

FastNestedField.displayName = 'FastNestedField';

interface NestedFieldProps {
  name: string;
  label: string;
  fields?: FieldConfig[];
  isCpgField?: boolean;
  isCpgComplete?: (
    name: string,
    values: Record<
      string,
      string | number | boolean | null | undefined | Record<string, string | number | boolean | null | undefined>[]
    >
  ) => boolean;
}

const NestedField: React.FC<NestedFieldProps> = memo(
  ({ name, label, fields = [], isCpgField = false, isCpgComplete }) => {
    return (
      <Field
        name={name}
        children={({ form }: FieldProps) => (
          <FastNestedField
            name={name}
            label={label}
            fields={fields}
            values={form.values}
            isCpgField={isCpgField}
            isCpgComplete={isCpgComplete}
          />
        )}
      />
    );
  }
);

NestedField.displayName = 'NestedField';

export default NestedField;
