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

interface ModifierFormProps {
  elementInstance: Instance;
  handleUpdateModifier: (modifier: Modifier | Modifier[]) => void;
  modifier: Modifier;
}

const ModifierForm: React.FC<ModifierFormProps> = ({ elementInstance, handleUpdateModifier, modifier }) => {
  switch (modifier.type || modifier.id) {
    case 'ValueComparisonNumber':
      return (
        <ValueComparisonModifier
          handleUpdateModifier={handleUpdateModifier}
          values={{
            maxOperator: (modifier.values as { maxOperator?: string })?.maxOperator || '',
            maxValue: (modifier.values as { maxValue?: string | number })?.maxValue ?? '',
            minOperator: (modifier.values as { minOperator?: string })?.minOperator || '',
            minValue: (modifier.values as { minValue?: string | number })?.minValue ?? ''
          }}
        />
      );
    case 'ValueComparisonObservation':
      return (
        <ValueComparisonModifier
          handleUpdateModifier={handleUpdateModifier}
          values={{
            maxOperator: (modifier.values as { maxOperator?: string })?.maxOperator || '',
            maxValue: (modifier.values as { maxValue?: string | number })?.maxValue ?? '',
            minOperator: (modifier.values as { minOperator?: string })?.minOperator || '',
            minValue: (modifier.values as { minValue?: string | number })?.minValue ?? '',
            unit: (modifier.values as { unit?: string })?.unit || ''
          }}
        />
      );
    case 'LookBack':
      return (
        <LookBackModifier
          handleUpdateModifier={handleUpdateModifier}
          unit={(modifier.values as { unit?: string })?.unit}
          value={(modifier.values as { value?: string | number })?.value}
        />
      );
    case 'WithUnit':
      return (
        <WithUnitModifier
          handleUpdateModifier={handleUpdateModifier}
          unit={(modifier.values as { unit?: string })?.unit}
        />
      );
    case 'BooleanComparison':
      return (
        <BooleanComparisonModifier
          handleUpdateModifier={handleUpdateModifier}
          value={(modifier.values as { value?: boolean })?.value}
        />
      );
    case 'CheckExistence':
      return (
        <CheckExistenceModifier
          handleUpdateModifier={handleUpdateModifier}
          value={(modifier.values as { value?: boolean })?.value}
        />
      );
    case 'ConvertObservation':
      return (
        <SelectModifier
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
          value={(modifier.values as { value?: string })?.value}
        />
      );
    case 'Qualifier':
      return (
        <QualifierModifier
          code={(modifier.values as { code?: string })?.code}
          handleUpdateModifier={handleUpdateModifier}
          qualifier={(modifier.values as { qualifier?: string })?.qualifier}
          valueSet={(modifier.values as { valueSet?: string })?.valueSet}
        />
      );
    case 'BeforeDateTimePrecise':
    case 'AfterDateTimePrecise':
      return (
        <DateTimeModifier
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
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
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
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
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
          unit={(modifier.values as { unit?: string })?.unit}
          value={(modifier.values as { value?: string | number })?.value}
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
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
          value={(modifier.values as { value?: string | number })?.value}
        />
      );
    case 'ContainsDateTime':
    case 'BeforeDateTime':
    case 'AfterDateTime':
      return (
        <DateTimeModifier
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
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
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
          value={(modifier.values as { value?: string })?.value}
        />
      );
    case 'ExternalModifier':
      return (
        <ExternalModifier
          argumentTypes={modifier.argumentTypes}
          handleUpdateModifier={handleUpdateModifier}
          modifierArguments={modifier.arguments}
          name={modifier.name}
          values={(modifier.values as { value?: unknown })?.value}
        />
      );

    case 'UserDefinedModifier':
      return (
        <UserDefinedModifier
          elementInstance={elementInstance}
          handleUpdateModifier={handleUpdateModifier}
          label={`Custom: ${getModifierExpression(modifier)}`}
          modifier={modifier}
        />
      );
    default:
      return <LabelModifier name={modifier.name} />;
  }
};

export default ModifierForm;
