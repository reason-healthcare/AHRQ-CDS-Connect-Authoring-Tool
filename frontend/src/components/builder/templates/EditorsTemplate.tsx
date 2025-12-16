import React from 'react';
import { Stack } from '@mui/material';

import ElementCardLabel from 'components/elements/ElementCard/ElementCardLabel';
import {
  BooleanEditor,
  CodeEditor,
  DateTimeEditor,
  NumberEditor,
  QuantityEditor,
  StringEditor,
  ValueSetEditor
} from 'components/builder/editors';

interface EditorsTemplateErrors {
  invalidInput?: boolean;
  incompleteInput?: boolean;
  [key: string]: unknown;
}

interface EditorsTemplateProps {
  errors?: EditorsTemplateErrors;
  handleUpdateEditor: (value: unknown) => void;
  isInterval?: boolean;
  isList?: boolean;
  label?: string;
  type: string;
  value?: unknown;
  [key: string]: unknown;
}

const EditorsTemplate: React.FC<EditorsTemplateProps> = ({
  errors,
  handleUpdateEditor,
  isInterval = false,
  isList = false,
  label,
  type,
  value,
  ...props
}) => {
  const editor = (() => {
    switch (type) {
      case 'boolean':
      case 'system_boolean':
        return <BooleanEditor handleUpdateEditor={handleUpdateEditor} value={value as string | undefined} />;
      case 'datetime':
      case 'system_date_time':
        return (
          <DateTimeEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            isInterval={isInterval}
            value={value as { date?: string | null; time?: string | null } | undefined}
          />
        );
      case 'decimal':
      case 'system_decimal':
        return (
          <NumberEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            isDecimal
            isInterval={isInterval}
            value={value as { decimal?: number | string } | string | number | undefined}
          />
        );
      case 'integer':
      case 'system_integer':
        return (
          <NumberEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            value={value as { decimal?: number | string } | string | number | undefined}
          />
        );
      case 'string':
        return <StringEditor handleUpdateEditor={handleUpdateEditor} value={value as string | undefined} />;
      case 'system_code':
        return (
          <CodeEditor
            handleUpdateEditor={handleUpdateEditor}
            isList={isList}
            value={
              value as
                | { id: string; system: string; uri: string; code: string; str: string }
                | Array<{ id: string; system: string; uri: string; code: string; str: string }>
                | undefined
            }
          />
        );
      case 'system_concept':
        return (
          <CodeEditor
            handleUpdateEditor={handleUpdateEditor}
            isList={isList}
            isConcept
            value={
              value as
                | { id: string; system: string; uri: string; code: string; str: string }
                | Array<{ id: string; system: string; uri: string; code: string; str: string }>
                | undefined
            }
          />
        );
      case 'system_quantity':
        return (
          <QuantityEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            isInterval={isInterval}
            value={value as { quantity?: number | string; unit?: string; str?: string } | string | undefined}
          />
        );
      case 'time':
      case 'system_time':
        return (
          <DateTimeEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            isInterval={isInterval}
            isTime
            value={value as { date?: string | null; time?: string | null } | undefined}
          />
        );
      case 'interval_of_integer':
        return (
          <NumberEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            isInterval
            value={
              value as
                | { firstInteger?: number | string; secondInteger?: number | string; str?: string }
                | string
                | number
                | undefined
            }
          />
        );
      case 'interval_of_datetime':
        return (
          <DateTimeEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            isInterval
            value={
              value as
                | {
                    firstDate?: string | null;
                    firstTime?: string | null;
                    secondDate?: string | null;
                    secondTime?: string | null;
                    str?: string;
                  }
                | undefined
            }
          />
        );
      case 'interval_of_decimal':
        return (
          <NumberEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            isDecimal
            isInterval
            value={
              value as
                | { firstDecimal?: number | string; secondDecimal?: number | string; str?: string }
                | string
                | number
                | undefined
            }
          />
        );
      case 'interval_of_quantity':
        return (
          <QuantityEditor
            errors={errors}
            handleUpdateEditor={handleUpdateEditor}
            isInterval
            value={
              value as
                | {
                    firstQuantity?: number | string | null;
                    secondQuantity?: number | string | null;
                    unit?: string;
                    str?: string;
                  }
                | string
                | undefined
            }
          />
        );
      case 'valueset':
        return (
          <ValueSetEditor
            handleUpdateEditor={handleUpdateEditor}
            value={value as { name: string; oid: string; [key: string]: unknown } | undefined}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <Stack alignItems="center" flexDirection="row" {...props}>
      {label && <ElementCardLabel label={label} />}

      {editor}
    </Stack>
  );
};

export default EditorsTemplate;
