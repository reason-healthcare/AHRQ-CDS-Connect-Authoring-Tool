import React from 'react';

import {
  BooleanComparisonModifier,
  CheckExistenceModifier,
  DateTimeModifier,
  ExternalModifier,
  LabelModifier,
  LookBackModifier,
  NumberModifier,
  QualifierModifier,
  QuantityModifier,
  SelectModifier,
  StringModifier,
  UserDefinedModifier,
  ValueComparisonModifier,
  WithUnitModifier
} from 'components/builder/modifiers';
import getModifierExpression from 'components/modals/ModifierModal/ModifierBuilder/utils/getModifierExpression';
import type { Instance, Modifier } from '../../../utils/instances';
import type { ModifierTree } from 'components/modals/ModifierModal/types';

interface ModifierFormProps {
  elementInstance: Instance;
  handleUpdateModifier: (modifier: Modifier | Modifier[]) => void;
  modifier: Modifier;
}

const ModifierForm: React.FC<ModifierFormProps> = ({ elementInstance, handleUpdateModifier, modifier }) => {
  // Wrapper function to convert partial updates to full modifier updates
  const createUpdateWrapper = <T extends Record<string, unknown>>(): ((updates: Partial<T>) => void) => {
    return (updates: Partial<T>) => {
      const updatedValues = {
        ...(modifier.values || {}),
        ...updates
      };
      const updatedModifier: Modifier = {
        ...modifier,
        values: updatedValues
      };
      handleUpdateModifier(updatedModifier);
    };
  };

  switch (modifier.type || modifier.id) {
    case 'ValueComparisonNumber':
      return (
        <ValueComparisonModifier
          handleUpdateModifier={createUpdateWrapper<{
            maxOperator?: string | null;
            maxValue?: number | string;
            minOperator?: string | null;
            minValue?: number | string;
          }>()}
          values={{
            maxOperator: (modifier.values as { maxOperator?: string })?.maxOperator ?? '',
            maxValue: (modifier.values as { maxValue?: string | number })?.maxValue ?? '',
            minOperator: (modifier.values as { minOperator?: string })?.minOperator ?? '',
            minValue: (modifier.values as { minValue?: string | number })?.minValue ?? ''
          }}
        />
      );
    case 'ValueComparisonObservation':
      return (
        <ValueComparisonModifier
          handleUpdateModifier={createUpdateWrapper<{
            maxOperator?: string | null;
            maxValue?: number | string;
            minOperator?: string | null;
            minValue?: number | string;
            unit?: string | null;
          }>()}
          values={{
            maxOperator: (modifier.values as { maxOperator?: string })?.maxOperator ?? '',
            maxValue: (modifier.values as { maxValue?: string | number })?.maxValue ?? '',
            minOperator: (modifier.values as { minOperator?: string })?.minOperator ?? '',
            minValue: (modifier.values as { minValue?: string | number })?.minValue ?? '',
            unit: (modifier.values as { unit?: string })?.unit ?? ''
          }}
        />
      );
    case 'LookBack':
      return (
        <LookBackModifier
          handleUpdateModifier={createUpdateWrapper<{ unit?: string | null; value?: number | null }>()}
          unit={(modifier.values as { unit?: string })?.unit}
          value={(modifier.values as { value?: string | number })?.value as number | null | undefined}
        />
      );
    case 'WithUnit':
      return (
        <WithUnitModifier
          handleUpdateModifier={createUpdateWrapper<{ unit?: string }>()}
          unit={(modifier.values as { unit?: string })?.unit}
        />
      );
    case 'BooleanComparison':
      return (
        <BooleanComparisonModifier
          handleUpdateModifier={createUpdateWrapper<{ value?: string }>()}
          value={(modifier.values as { value?: string })?.value}
        />
      );
    case 'CheckExistence':
      return (
        <CheckExistenceModifier
          handleUpdateModifier={createUpdateWrapper<{ value?: string }>()}
          value={(modifier.values as { value?: string })?.value}
        />
      );
    case 'ConvertObservation':
      return (
        <SelectModifier
          handleUpdateModifier={createUpdateWrapper<{ value?: string }>()}
          name={(modifier as { name?: string }).name}
          value={(modifier.values as { value?: string })?.value}
        />
      );
    case 'Qualifier':
      return (
        <QualifierModifier
          code={
            (modifier.values as { code?: unknown })?.code as
              | { id: string; system: string; uri: string; code: string; display?: string; str: string }
              | undefined
          }
          handleUpdateModifier={createUpdateWrapper<{
            qualifier?: string | null;
            valueSet?: { name: string; oid: string; [key: string]: unknown } | null;
            code?: { id: string; system: string; uri: string; code: string; display?: string; str: string } | null;
          }>()}
          qualifier={(modifier.values as { qualifier?: string })?.qualifier}
          valueSet={
            (modifier.values as { valueSet?: unknown })?.valueSet as
              | { name: string; oid: string; [key: string]: unknown }
              | undefined
          }
        />
      );
    case 'BeforeDateTimePrecise':
    case 'AfterDateTimePrecise':
      return (
        <DateTimeModifier
          handleUpdateModifier={createUpdateWrapper<{
            date?: string | null;
            time?: string | null;
            precision?: string | null;
          }>()}
          name={(modifier as { name?: string }).name || ''}
          values={{
            date: (modifier.values as { date?: string })?.date || '',
            time: (modifier.values as { time?: string })?.time || '',
            precision: (modifier.values as { precision?: string })?.precision || ''
          }}
        />
      );
    case 'BeforeTimePrecise':
    case 'AfterTimePrecise':
      return (
        <DateTimeModifier
          handleUpdateModifier={createUpdateWrapper<{
            date?: string | null;
            time?: string | null;
            precision?: string | null;
          }>()}
          name={(modifier as { name?: string }).name || ''}
          values={{
            time: (modifier.values as { time?: string })?.time || '',
            precision: (modifier.values as { precision?: string })?.precision || ''
          }}
        />
      );
    case 'ContainsQuantity':
    case 'BeforeQuantity':
    case 'AfterQuantity':
      return (
        <QuantityModifier
          handleUpdateModifier={createUpdateWrapper<{ value: number | string; unit: string }>()}
          name={(modifier as { name?: string }).name || ''}
          unit={(modifier.values as { unit?: string })?.unit}
          value={(modifier.values as { value?: string | number })?.value as number | undefined}
        />
      );
    case 'ContainsInteger':
    case 'BeforeInteger':
    case 'AfterInteger':
    case 'ContainsDecimal':
    case 'BeforeDecimal':
    case 'AfterDecimal':
      return (
        <NumberModifier
          handleUpdateModifier={createUpdateWrapper<{ value: string }>()}
          name={(modifier as { name?: string }).name || ''}
          value={String((modifier.values as { value?: string | number })?.value || '')}
        />
      );
    case 'ContainsDateTime':
    case 'BeforeDateTime':
    case 'AfterDateTime':
      return (
        <DateTimeModifier
          handleUpdateModifier={createUpdateWrapper<{
            date?: string | null;
            time?: string | null;
            precision?: string | null;
          }>()}
          name={(modifier as { name?: string }).name || ''}
          values={{
            date: (modifier.values as { date?: string })?.date || '',
            time: (modifier.values as { time?: string })?.time || ''
          }}
        />
      );
    case 'EqualsString':
    case 'EndsWithString':
    case 'StartsWithString':
      return (
        <StringModifier
          handleUpdateModifier={createUpdateWrapper<{ value: string }>()}
          name={(modifier as { name?: string }).name || ''}
          value={(modifier.values as { value?: string })?.value}
        />
      );
    case 'ExternalModifier':
      return (
        <ExternalModifier
          argumentTypes={
            (modifier as { argumentTypes?: Array<{ calculated: string; [key: string]: unknown }> }).argumentTypes || []
          }
          handleUpdateModifier={createUpdateWrapper<{ value: unknown[] }>()}
          modifierArguments={
            ((modifier as { arguments?: unknown[] }).arguments || []) as Array<{ name: string; [key: string]: unknown }>
          }
          name={(modifier as { name?: string }).name || ''}
          values={(modifier.values as { value?: unknown })?.value as unknown[] | undefined}
        />
      );

    case 'UserDefinedModifier':
      return (
        <UserDefinedModifier
          elementInstance={elementInstance}
          handleUpdateModifier={handleUpdateModifier}
          label={`Custom: ${getModifierExpression(modifier as ModifierTree)}`}
          modifier={modifier}
        />
      );
    default:
      return <LabelModifier name={(modifier as { name?: string }).name || ''} />;
  }
};

export default ModifierForm;
