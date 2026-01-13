import React from 'react';
import { Divider, Stack } from '@mui/material';

import ElementCardLabel from 'components/elements/ElementCard/ElementCardLabel';
import { Dropdown, ElementCard } from 'components/elements';
import { ElementExpressionPhrase } from 'components/elements/ElementCard';
import { EditorsTemplate, ReferenceTemplate } from 'components/builder/templates';
import { parameterHasDuplicateName, parameterHasChangedUse } from './utils';
import { getEditorErrors } from 'components/builder/editors/utils';
import { startsWithVowel, valueToString } from 'utils/strings';
import type { Parameter as ParameterType } from '../../../types/artifact';

interface TypeOption {
  value: string;
  label: string;
  [key: string]: string | number | boolean | React.ReactNode | undefined;
}

const typeOptions: TypeOption[] = [
  { value: 'boolean', label: 'Boolean' },
  { value: 'system_code', label: 'Code' },
  { value: 'system_concept', label: 'Concept' },
  { value: 'integer', label: 'Integer' },
  { value: 'datetime', label: 'DateTime' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'system_quantity', label: 'Quantity' },
  { value: 'string', label: 'String' },
  { value: 'time', label: 'Time' },
  { value: 'interval_of_integer', label: 'Interval<Integer>' },
  { value: 'interval_of_datetime', label: 'Interval<DateTime>' },
  { value: 'interval_of_decimal', label: 'Interval<Decimal>' },
  { value: 'interval_of_quantity', label: 'Interval<Quantity>' }
];

interface ParameterProps {
  allElements: any[];

  elementNames: any[];
  handleDeleteParameter: () => void;
  handleUpdateParameter: (parameter: ParameterType) => void;
  parameter: ParameterType;
  setShowAllContent: (show: boolean) => void;
  showAllContent?: boolean;
}

const Parameter: React.FC<ParameterProps> = ({
  allElements,
  elementNames,
  handleDeleteParameter,
  handleUpdateParameter,
  parameter,
  setShowAllContent,
  showAllContent
}) => {
  const { comment, name, type, uniqueId, usedBy, value } = parameter;

  const { errors, hasErrors } = getEditorErrors(type, value as any);
  const valueStr = valueToString(value);
  const parameterIsUsed = Boolean(usedBy?.length !== 0);

  const hasDuplicateName = parameterHasDuplicateName(parameter, elementNames as any);

  const hasChangedUse = parameterHasChangedUse(parameter, allElements as any);

  const parameterAlerts = [
    {
      alertSeverity: 'error' as const,
      alertMessage: 'Name already in use. Choose another name.',
      showAlert: hasDuplicateName && !hasChangedUse
    },
    {
      alertSeverity: 'info' as const,
      alertMessage: "Parameter name and type can't be changed while it is being referenced.",
      showAlert: parameterIsUsed
    }
  ];

  const typeLabel = typeOptions.find(({ value }) => value === type)?.label || type;
  const expressions = [
    { label: startsWithVowel(type) ? 'An' : 'A' },
    { label: typeLabel, isTag: true },
    { label: 'parameter' },
    { label: valueStr ? 'that defaults to' : 'with no default value' }
  ];
  if (valueStr) expressions.push({ label: valueStr, isTag: true });

  const handleUpdateType = (newType: string): void => {
    const typeOption = typeOptions.find(({ value }) => value === newType);
    if (typeOption) handleUpdateParameter({ ...parameter, type: typeOption.value, value: null });
  };

  return (
    <ElementCard
      alerts={parameterAlerts}
      collapsedContent={<ElementExpressionPhrase expressions={expressions} />}
      commentField={{ id: uniqueId, name: 'Comment', value: comment }}
      disableDeleteMessage={parameterIsUsed && 'To delete this parameter, remove all references to it.'}
      disableTitleField={parameterIsUsed}
      handleDelete={handleDeleteParameter}
      handleUpdateComment={(event: any) => handleUpdateParameter({ ...parameter, comment: event[uniqueId as string] })}
      handleUpdateTitleField={(event: any) => handleUpdateParameter({ ...parameter, name: event[uniqueId as string] })}
      hasErrors={(hasDuplicateName && !hasChangedUse) || hasErrors}
      label="parameter"
      setShowAllContent={setShowAllContent}
      showAllContent={showAllContent}
      titleField={{ id: uniqueId, value: name }}
    >
      <Stack divider={<Divider flexItem sx={{ marginLeft: '230px' }} />}>
        {parameterIsUsed &&
          [...new Set(usedBy)].map(parameterUseId => (
            <ReferenceTemplate
              key={parameterUseId}
              elementNames={elementNames as any}
              referenceField={{ id: 'parameterUse', value: { id: parameterUseId } }}
              referenceInstanceTab={(allElements.find(({ uniqueId }: any) => uniqueId === parameterUseId) as any)?.tab}
            />
          ))}

        <Stack alignItems="center" flexDirection="row" ml="20px" my={1}>
          <ElementCardLabel label="Parameter Type" />

          <Dropdown
            disabled={parameterIsUsed}
            hiddenLabel={Boolean(type)}
            label={type ? null : 'Parameter type'}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleUpdateType(event.target.value)}
            options={typeOptions as any}
            sx={{ my: 1, width: { xs: '200px', xxl: '300px' } }}
            value={type}
          />
        </Stack>

        <EditorsTemplate
          errors={errors}
          handleUpdateEditor={(newValue: unknown) => handleUpdateParameter({ ...parameter, value: newValue })}
          label="Default Value"
          sx={{ ml: '20px' }}
          type={type}
          value={value}
        />
      </Stack>
    </ElementCard>
  );
};

export default Parameter;
