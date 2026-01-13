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
  handleUpdateModifier: (values: Record<string, unknown>) => void;
  modifier: Modifier;
}

const ModifierForm: React.FC<ModifierFormProps> = ({ elementInstance, handleUpdateModifier, modifier }) => {
  const values = modifier.values as Record<string, unknown> | undefined;

  switch (modifier.type || modifier.id) {
    case 'ValueComparisonNumber':
      return (
        <ValueComparisonModifier
          handleUpdateModifier={handleUpdateModifier}
          values={{
            maxOperator: (values?.maxOperator as string) || '',
            maxValue: (values?.maxValue as string | number) ?? '',
            minOperator: (values?.minOperator as string) || '',
            minValue: (values?.minValue as string | number) ?? ''
          }}
        />
      );
    case 'ValueComparisonObservation':
      return (
        <ValueComparisonModifier
          handleUpdateModifier={handleUpdateModifier}
          values={{
            maxOperator: (values?.maxOperator as string) || '',
            maxValue: (values?.maxValue as string | number) ?? '',
            minOperator: (values?.minOperator as string) || '',
            minValue: (values?.minValue as string | number) ?? '',
            unit: (values?.unit as string) || ''
          }}
        />
      );
    case 'LookBack':
      return (
        <LookBackModifier
          handleUpdateModifier={handleUpdateModifier}
          unit={values?.unit as string | undefined}
          value={values?.value as number | undefined}
        />
      );
    case 'WithUnit':
      return <WithUnitModifier handleUpdateModifier={handleUpdateModifier} unit={values?.unit as string | undefined} />;
    case 'BooleanComparison':
      return (
        <BooleanComparisonModifier
          handleUpdateModifier={handleUpdateModifier}
          value={values?.value as string | undefined}
        />
      );
    case 'CheckExistence':
      return (
        <CheckExistenceModifier
          handleUpdateModifier={handleUpdateModifier}
          value={values?.value as string | undefined}
        />
      );
    case 'ConvertObservation':
      return (
        <SelectModifier
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
          value={values?.value as string | undefined}
        />
      );
    case 'Qualifier':
      return (
        <QualifierModifier
          code={values?.code as any}
          handleUpdateModifier={handleUpdateModifier}
          qualifier={values?.qualifier as string | undefined}
          valueSet={values?.valueSet as any}
        />
      );
    case 'BeforeDateTimePrecise':
    case 'AfterDateTimePrecise':
      return (
        <DateTimeModifier
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
          values={{
            date: (values?.date as string) || '',
            time: (values?.time as string) || '',
            precision: (values?.precision as string) || ''
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
            time: (values?.time as string) || '',
            precision: (values?.precision as string) || ''
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
          unit={values?.unit as string | undefined}
          value={values?.value as number | undefined}
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
          value={values?.value as string | number | undefined}
        />
      );
    case 'ContainsDateTime':
    case 'BeforeDateTime':
    case 'AfterDateTime':
      return (
        <DateTimeModifier
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
          values={{ date: (values?.date as string) || '', time: (values?.time as string) || '' }}
        />
      );
    case 'EqualsString':
    case 'EndsWithString':
    case 'StartsWithString':
      return (
        <StringModifier
          handleUpdateModifier={handleUpdateModifier}
          name={modifier.name}
          value={values?.value as string | undefined}
        />
      );
    case 'ExternalModifier':
      return (
        <ExternalModifier
          argumentTypes={modifier.argumentTypes as any}
          handleUpdateModifier={handleUpdateModifier}
          modifierArguments={modifier.arguments as any}
          name={modifier.name}
          values={values?.value as any}
        />
      );

    case 'UserDefinedModifier':
      return (
        <UserDefinedModifier
          elementInstance={elementInstance}
          handleUpdateModifier={handleUpdateModifier}
          label={`Custom: ${getModifierExpression(modifier as unknown as ModifierTree)}`}
          modifier={modifier as unknown as ModifierTree}
        />
      );
    default:
      return <LabelModifier name={modifier.name} />;
  }
};

export default ModifierForm;
