import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import pluralize from 'pluralize';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

import ElementSelectActions from './ElementSelectActions';
import ElementSelectDropdown from './ElementSelectDropdown';
import { getElementEntries } from './utils';
import { sortAlphabeticallyByKey } from 'utils/sort';
import { changeToCase } from 'utils/strings';
import { fetchExternalCqlList } from 'queries/external-cql';
import fetchTemplates from 'queries/fetchTemplates';
import type { Template, ExternalCqlLibrary } from '../../../types/query';
import type { Instance } from '../../../utils/instances';
import useStyles from './styles';

export const VSAC_OPTIONS = [
  'allergyIntolerances',
  'conditions',
  'device',
  'encounters',
  'immunizations',
  'medicationStatements',
  'medicationRequests',
  'observations',
  'procedures',
  'serviceRequest'
] as const;

interface ElementSelectProps {
  excludeListOperations?: boolean;
  handleAddElement: (template: Instance) => void;
  indentParity?: string;
  isDisabled?: boolean;
  parentElementId?: string;
}

interface ElementOption {
  label: string;
  value: string;
  options?: Array<{ label: string; value: Instance }>;
  hasEmptyList?: boolean;
  isVersionLocked?: boolean;
}

const ElementSelect: React.FC<ElementSelectProps> = ({
  excludeListOperations = false,
  handleAddElement,
  indentParity,
  isDisabled,
  parentElementId
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { _id: artifactId } = artifact || { _id: undefined };
  const { data: externalCqlList } = useQuery<ExternalCqlLibrary[]>({
    queryKey: ['externalCql', { artifactId }],
    queryFn: () => fetchExternalCqlList({ artifactId: artifactId || '' }),
    enabled: artifactId != null
  });
  const { data: elementTemplates } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: () => fetchTemplates(),
    staleTime: Infinity
  });
  const styles = useStyles();
  const background = (indentParity && (styles as Record<string, string>)[indentParity]) ?? '';

  const elementOptions = useMemo<ElementOption[]>(() => {
    if (!artifact || !elementTemplates) return [];
    const filterOut = ['Medications', 'Operations', excludeListOperations && 'List Operations'].filter(
      Boolean
    ) as string[];
    const versionLockMap: Record<string, string[]> = {
      serviceRequest: ['4.0.0', '4.0.1', '4.0.x']
    };

    const result = elementTemplates
      .filter(template => !(template as { suppress?: boolean }).suppress && !filterOut.includes(template.name || ''))
      .map(template => {
        const value = changeToCase(template.name || '', 'camelCase');
        const options = getElementEntries({
          entryType: value,
          artifact,
          elementTemplates,
          externalCqlList: externalCqlList || [],
          parentElementId
        });
        const hasEmptyList = (options?.length || 0) === 0;
        const isVersionLocked =
          artifact.fhirVersion !== '' && !(versionLockMap[value]?.includes(artifact.fhirVersion) ?? true);

        return {
          label: pluralize(template.name || ''),
          value,
          options,
          hasEmptyList,
          isVersionLocked
        };
      })
      .filter(option => !option.hasEmptyList && !option.isVersionLocked)
      .sort(sortAlphabeticallyByKey('label'));

    return result;
  }, [elementTemplates, excludeListOperations, artifact, externalCqlList, parentElementId]);

  const selectedOptionData = useMemo(
    () => elementOptions.find(option => option.value === selectedOption),
    [elementOptions, selectedOption]
  );

  if (!artifact) return null;

  const handleSelectOption = (option: ElementOption): void => {
    setSelectedOption(option.value);
  };

  const handleSelectElement = (_element: unknown, _type: string): void => {
    // This function is passed to ElementSelectActions (still JS) to handle code/valueSet selection
    // The actual implementation would add codes/valueSets to element fields
    // For now, this is a stub since ElementSelectActions is still JS
  };

  const handleClose = (): void => {
    setSelectedOption(null);
  };

  return (
    <Card className={background} style={{ marginTop: '10px' }}>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ElementSelectDropdown
            options={elementOptions as any}
            handleSelectOption={handleSelectOption as any}
            isDisabled={isDisabled}
            label="Select Element Type"
            value={selectedOption}
            showFooter={false}
          />

          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>

        {selectedOptionData && <ElementSelectActions handleSelectElement={handleSelectElement as any} />}
      </CardContent>
    </Card>
  );
};

export default ElementSelect;
