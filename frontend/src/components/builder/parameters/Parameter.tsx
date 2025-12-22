import React from 'react';
import { Divider, Stack } from '@mui/material';

import ElementCardLabel from 'components/elements/ElementCard/ElementCardLabel';
import { Dropdown, ElementCard } from 'components/elements';
import { ElementExpressionPhrase } from 'components/elements/ElementCard';
import { EditorsTemplate, ReferenceTemplate } from 'components/builder/templates';
import { parameterHasDuplicateName, parameterHasChangedUse } from './utils';
import { getEditorErrors } from 'components/builder/editors/utils';
import { startsWithVowel, valueToString } from 'utils/strings';
import type { Parameter as ParameterType, ParameterValue } from '../../../types/artifact';
import type { Instance } from '../../../utils/instances';

interface ElementName {
  name: string;
  id: string;
}

interface TypeOption {
  value: string;
  label: string;
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
  allElements: Instance[];
  elementNames: ElementName[];
  handleDeleteParameter: (uniqueId: string | undefined) => void;
  handleUpdateParameter: (updatedParameter: Partial<ParameterType> & { uniqueId?: string }) => void;
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
  // Convert ParameterValue to EditorValue (ParameterValue can include object type, but EditorValue doesn't)
  const editorValue: string | number | null | undefined =
    typeof value === 'object' && value !== null && 'value' in value
      ? (value.value as string | number | undefined)
      : (value as string | number | null | undefined);
  const editorErrorResult = getEditorErrors(type || '', editorValue);
  const { errors, hasErrors } = editorErrorResult;
  const templateErrors = errors;
  const valueStr = valueToString(value);
  const parameterIsUsed = Boolean(usedBy && usedBy.length !== 0);
  const hasDuplicateName = parameterHasDuplicateName(parameter, elementNames);
  const hasChangedUse = parameterHasChangedUse(parameter, allElements);

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

  const expressions = [
    { label: startsWithVowel(type) ? 'An' : 'A' },
    { label: typeOptions.find(({ value }) => value === type)?.label || '', isTag: true },
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
      commentField={{ id: uniqueId || '', name: 'Comment', value: typeof comment === 'string' ? comment : '' }}
      disableDeleteMessage={parameterIsUsed ? 'To delete this parameter, remove all references to it.' : undefined}
      disableTitleField={parameterIsUsed}
      handleDelete={() => handleDeleteParameter(uniqueId)}
      handleUpdateComment={event =>
        handleUpdateParameter({ ...parameter, comment: typeof event.value === 'string' ? event.value : '' })
      }
      handleUpdateTitleField={event =>
        handleUpdateParameter({ ...parameter, name: typeof event.value === 'string' ? event.value : '' })
      }
      hasErrors={(hasDuplicateName && !hasChangedUse) || hasErrors}
      label="parameter"
      setShowAllContent={setShowAllContent}
      showAllContent={showAllContent}
      titleField={{ id: uniqueId || '', value: typeof name === 'string' ? name : '' }}
    >
      <Stack divider={<Divider flexItem sx={{ marginLeft: '230px' }} />}>
        {parameterIsUsed &&
          usedBy &&
          [...new Set(usedBy)].map(parameterUseId => {
            const useElement = allElements.find(({ uniqueId }) => uniqueId === parameterUseId);
            if (!useElement) return null;
            return (
              <ReferenceTemplate
                key={parameterUseId}
                elementNames={elementNames}
                referenceField={{ id: 'parameterUse', value: { id: parameterUseId } }}
                referenceInstanceTab={useElement.tab}
              />
            );
          })}

        <Stack alignItems="center" flexDirection="row" ml="20px" my={1}>
          <ElementCardLabel label="Parameter Type" />

          <Dropdown
            disabled={parameterIsUsed}
            hiddenLabel={Boolean(type)}
            label={type ? null : 'Parameter type'}
            onChange={event => handleUpdateType(event.target.value)}
            options={typeOptions.map(opt => ({ label: opt.label, value: opt.value }))}
            sx={{ my: 1, width: { xs: '200px', xxl: '300px' } }}
            value={type || ''}
          />
        </Stack>

        <EditorsTemplate
          errors={templateErrors}
          handleUpdateEditor={newValue => handleUpdateParameter({ ...parameter, value: newValue as ParameterValue })}
          label="Default Value"
          sx={{ ml: '20px' }}
          type={type || ''}
          value={editorValue}
        />
      </Stack>
    </ElementCard>
  );
};

export default Parameter;
