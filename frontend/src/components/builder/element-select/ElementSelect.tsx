import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import pluralize from 'pluralize';
import _ from 'lodash';

import { useAppSelector } from '../../../store/hooks';
import ElementSelectActions from './ElementSelectActions';
import ElementSelectDropdown from './ElementSelectDropdown';
import { getElementEntries, generateElement } from './utils';
import { sortAlphabeticallyByKey } from 'utils/sort';
import { changeToCase } from 'utils/strings';
import { fetchExternalCqlList } from 'queries/external-cql';
import fetchTemplates from 'queries/fetchTemplates';
import useStyles from './styles';
import type { Template, ExternalCqlLibrary } from '../../../types/query';
import type { Instance } from '../../../utils/instances';

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
];

interface ElementOption {
  hasEmptyList?: boolean;
  isDisabled?: boolean;
  isVersionLocked?: boolean;
  label: string;
  options?: ElementOption[];
  value: string;
  vsacAuthRequired?: boolean;
  [key: string]: unknown;
}

interface ElementSelectProps {
  excludeListOperations?: boolean;
  handleAddElement: (element: Instance) => void;
  indentParity?: string;
  isDisabled?: boolean;
  parentElementId?: string;
}

interface VsacSelection {
  display?: string;
  code?: string;
  codeSystem?: { name: string; id: string };
  name?: string;
  oid?: string;
  value?: string;
  [key: string]: unknown;
}

const ElementSelect: React.FC<ElementSelectProps> = ({
  excludeListOperations = false,
  handleAddElement,
  indentParity,
  isDisabled,
  parentElementId
}) => {
  const [selectedOption, setSelectedOption] = useState<ElementOption | null>(null);
  const [selectedSuboption, setSelectedSuboption] = useState<ElementOption | null>(null);
  const [selectedCqlOption, setSelectedCqlOption] = useState<ElementOption | null>(null);
  const [showVSACSelect, setShowVSACSelect] = useState(false);
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { _id: artifactId } = artifact;
  const { data: externalCqlList } = useQuery<ExternalCqlLibrary[]>({
    queryKey: ['externalCql', { artifactId }],
    queryFn: () => fetchExternalCqlList({ artifactId })
  });
  const { data: elementTemplates } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: () => fetchTemplates(),
    staleTime: Infinity
  });
  const styles = useStyles();

  const background = (styles as Record<string, string>)[indentParity as string] ?? '';

  const elementOptions = useMemo<ElementOption[]>(() => {
    if (!elementTemplates) return [];
    const filterOut = ['Medications', 'Operations', excludeListOperations && 'List Operations'].filter(Boolean);
    const versionLockMap: Record<string, string[]> = {
      serviceRequest: ['4.0.0', '4.0.1', '4.0.x']
    };

    const result = elementTemplates
      .filter(template => !template.suppress && !filterOut.includes(template.name))
      .map(template => {
        const value = changeToCase(template.name, 'camelCase');
        const options = getElementEntries({
          entryType: value,
          artifact,
          elementTemplates,
          externalCqlList,
          parentElementId
        });
        const hasEmptyList = options?.length === 0;
        const isVersionLocked =
          artifact.fhirVersion !== '' && !(versionLockMap[value]?.includes(artifact.fhirVersion) ?? true);

        return {
          hasEmptyList,
          isDisabled: hasEmptyList || isVersionLocked,
          isVersionLocked,
          label: VSAC_OPTIONS.includes(value) ? pluralize.singular(template.name) : template.name,
          options,
          value,
          vsacAuthRequired: Boolean(VSAC_OPTIONS.includes(value))
        };
      });

    // add medication statement and medication request
    const medicationOptions: ElementOption[] = [
      { isDisabled: false, label: 'Medication Statement', value: 'medicationStatement', vsacAuthRequired: true },
      { isDisabled: false, label: 'Medication Request', value: 'medicationRequest', vsacAuthRequired: true }
    ];

    return [...result, ...medicationOptions].sort(sortAlphabeticallyByKey('label'));
  }, [artifact, elementTemplates, excludeListOperations, externalCqlList, parentElementId]);

  const handleClearOptions = (): void => {
    setSelectedOption(null);
    setSelectedSuboption(null);
    setSelectedCqlOption(null);
    setShowVSACSelect(false);
  };

  const handleSelectOption = (optionValue: string): void => {
    setSelectedSuboption(null);
    setSelectedCqlOption(null);
    const option = elementOptions.find(option => option.value === optionValue);
    if (option) {
      setSelectedOption(option);
      setShowVSACSelect(!!option.vsacAuthRequired);
    }
  };

  const handleSelectElement = (selectedElement: any, vsacType?: string): void => {
    if (!selectedOption || !elementTemplates) return;

    let templateName: string;
    if (['And', 'Or'].includes(selectedElement.value || '')) templateName = 'Operations';
    else if (['medicationRequest', 'medicationStatement'].includes(selectedOption.value)) templateName = 'Medications';
    else templateName = changeToCase(selectedOption.value, 'capitalCase');
    const template = _.cloneDeep(elementTemplates.find(template => template.name === templateName));

    const element = generateElement({
      artifact,
      cqlOption: selectedOption.value === 'externalCql' ? selectedElement : null,
      externalCqlList,
      option: selectedOption.value,
      subOption: selectedSuboption?.value || selectedElement.value,
      template,
      vsacCode: vsacType === 'codes' ? selectedElement : null,
      vsacValueSet: vsacType === 'valueSets' ? selectedElement : null,

      vsacType: vsacType as any
    });

    handleAddElement(element as Instance);
    handleClearOptions();
  };

  const handleSelectSuboption = (suboptionValue: string): void => {
    if (!selectedOption) return;
    const suboption = selectedOption.options?.find(option => option.value === suboptionValue);
    if (suboption?.options) {
      setSelectedSuboption(suboption);
      setSelectedCqlOption(null);
    } else if (suboption) {
      handleSelectElement(suboption as VsacSelection);
    }
  };

  return (
    <Card className={background}>
      <CardContent>
        <div className={styles.elementSelect}>
          <div className={styles.elementSelectGroup}>
            <div className={styles.elementSelectLabel}>New element:</div>

            <div className={styles.elementSelectDropdowns}>
              <ElementSelectDropdown
                handleSelectOption={handleSelectOption}
                isDisabled={isDisabled}
                label="Element type"
                options={(elementOptions || []) as any}
                showFooter
                value={selectedOption?.value || ''}
              />

              {selectedOption && !selectedOption.vsacAuthRequired && (
                <ElementSelectDropdown
                  handleSelectOption={handleSelectSuboption}
                  label={selectedOption.value === 'baseElements' ? 'Base Element' : `${selectedOption.label} Element`}
                  options={(selectedOption.options || []) as any}
                  value={selectedSuboption?.value || ''}
                />
              )}

              {selectedSuboption && (
                <ElementSelectDropdown
                  handleSelectOption={handleSelectElement}
                  label="Definition, function, or parameter"
                  options={(selectedSuboption.options || []) as any}
                  value={selectedCqlOption?.value || ''}
                />
              )}
            </div>
          </div>

          {selectedOption && (
            <IconButton aria-label="close" onClick={() => handleClearOptions()} size="large">
              <CloseIcon />
            </IconButton>
          )}
        </div>
      </CardContent>

      {showVSACSelect && <ElementSelectActions handleSelectElement={handleSelectElement} />}
    </Card>
  );
};

export default ElementSelect;
