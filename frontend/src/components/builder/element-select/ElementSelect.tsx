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
  options?: Array<{ label: string; value: string; options?: Array<{ value: string; label: string }> }>;
  hasEmptyList?: boolean;
  isVersionLocked?: boolean;
  vsacAuthRequired?: boolean;
  isDisabled?: boolean;
  [key: string]:
    | string
    | number
    | boolean
    | React.ReactNode
    | Array<{ label: string; value: string; options?: Array<{ value: string; label: string }> }>
    | undefined;
}

const ElementSelect: React.FC<ElementSelectProps> = ({
  excludeListOperations = false,
  handleAddElement,
  indentParity,
  isDisabled,
  parentElementId
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedSubOption, setSelectedSubOption] = useState<string | null>(null);
  const [selectedCqlOption, setSelectedCqlOption] = useState<string | null>(null);
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { _id: artifactId } = artifact;
  const { data: externalCqlList } = useQuery<ExternalCqlLibrary[]>({
    queryKey: ['externalCql', { artifactId }],
    queryFn: () => fetchExternalCqlList({ artifactId }),
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
    if (!elementTemplates) return [];
    const filterOut = ['Medications', 'Operations', excludeListOperations && 'List Operations'].filter(
      Boolean
    ) as string[];
    const versionLockMap: Record<string, string[]> = {
      serviceRequest: ['4.0.0', '4.0.1', '4.0.x']
    };

    // Special handling for Medications template - create separate options for each entry
    const medicationsTemplate = elementTemplates.find(template => template.name === 'Medications');
    const medicationsOptions: ElementOption[] = medicationsTemplate
      ? medicationsTemplate.entries
          .filter(entry => entry.name === 'Medication Statement' || entry.name === 'Medication Request')
          .map(entry => {
            // Map entry names to VSAC_OPTIONS values
            const valueMap: Record<string, string> = {
              'Medication Statement': 'medicationStatements',
              'Medication Request': 'medicationRequests'
            };
            const value = valueMap[entry.name] || changeToCase(entry.name, 'camelCase');
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
            const isVsacOption = VSAC_OPTIONS.includes(value as (typeof VSAC_OPTIONS)[number]);
            const label = isVsacOption && entry.name ? pluralize.singular(entry.name) : entry.name;

            return {
              label,
              value,
              options,
              hasEmptyList,
              isVersionLocked,
              vsacAuthRequired: isVsacOption,
              isDisabled: hasEmptyList && !isVsacOption
            };
          })
      : [];

    // Regular template handling
    const regularOptions = elementTemplates
      .filter(template => !(template as { suppress?: boolean }).suppress && !filterOut.includes(template.name))
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

        // For VSAC options, use singular form to match test expectations
        const isVsacOption = VSAC_OPTIONS.includes(value as (typeof VSAC_OPTIONS)[number]);
        const label = isVsacOption && template.name ? pluralize.singular(template.name) : template.name || '';

        return {
          label,
          value,
          options,
          hasEmptyList,
          isVersionLocked,
          vsacAuthRequired: isVsacOption,
          isDisabled: hasEmptyList && !isVsacOption
        };
      });

    const result = [...medicationsOptions, ...regularOptions]
      .filter(option => !option.isVersionLocked)
      .sort(sortAlphabeticallyByKey<ElementOption>('label'));

    return result;
  }, [elementTemplates, excludeListOperations, artifact, externalCqlList, parentElementId]);

  const selectedOptionData = useMemo(
    () => elementOptions.find(option => option.value === selectedOption),
    [elementOptions, selectedOption]
  );

  if (!artifact) return null;

  const handleSelectOption = (optionValue: string): void => {
    const option = elementOptions.find(opt => opt.value === optionValue);
    if (option) {
      setSelectedOption(option.value);
      setSelectedSubOption(null);
      setSelectedCqlOption(null);
    }
  };

  const handleSelectSubOption = (subOptionValue: string): void => {
    setSelectedSubOption(subOptionValue);

    if (!selectedOptionData || !elementTemplates || !artifact || !selectedOption) return;

    // Check if this is external CQL with nested options
    if (selectedOption === 'externalCql') {
      // External CQL has nested structure - don't generate element yet, show next dropdown
      return;
    }

    // VSAC options without sub-options should not call this - they show ElementSelectActions instead
    const isVsacOption = VSAC_OPTIONS.includes(selectedOption as (typeof VSAC_OPTIONS)[number]);
    if (isVsacOption && (!selectedOptionData.options || selectedOptionData.options.length === 0)) {
      return;
    }

    // Import generateElement from utils
    const { generateElement } = require('./utils');
    // For medicationStatements/medicationRequests, use Medications template
    let templateName = selectedOption;
    if (selectedOption === 'medicationStatement' || selectedOption === 'medicationRequest') {
      templateName = 'medications';
    }
    const template = elementTemplates.find(t => changeToCase(t.name || '', 'camelCase') === templateName);
    if (template) {
      const element = generateElement({
        artifact,
        cqlOption: null,
        externalCqlList,
        option: selectedOption,
        subOption: subOptionValue,
        template,
        vsacCode: null,
        vsacValueSet: null,
        vsacType: null
      });
      if (element) {
        handleAddElement(element as Instance);
        setSelectedOption(null);
        setSelectedSubOption(null);
        setSelectedCqlOption(null);
      }
    }
  };

  const handleSelectCqlOption = (cqlOptionValue: string): void => {
    setSelectedCqlOption(cqlOptionValue);

    if (!selectedOptionData || !elementTemplates || !artifact || !selectedOption || !selectedSubOption) return;

    // Import generateElement from utils
    const { generateElement } = require('./utils');
    const template = elementTemplates.find(t => changeToCase(t.name || '', 'camelCase') === selectedOption);
    if (template) {
      const element = generateElement({
        artifact,
        cqlOption: cqlOptionValue,
        externalCqlList,
        option: selectedOption,
        subOption: selectedSubOption,
        template,
        vsacCode: null,
        vsacValueSet: null,
        vsacType: null
      });
      if (element) {
        handleAddElement(element as Instance);
        setSelectedOption(null);
        setSelectedSubOption(null);
        setSelectedCqlOption(null);
      }
    }
  };

  interface CodeSelection {
    display: string;
    code: string;
    codeSystem: { name: string; id: string };
  }

  interface ValueSetSelection {
    name: string;
    oid: string;
  }

  const handleSelectElement = (vsacData: CodeSelection | ValueSetSelection, vsacType: 'codes' | 'valueSets'): void => {
    if (!selectedOptionData || !elementTemplates || !artifact || !selectedOption) return;

    // Import generateElement from utils
    const { generateElement } = require('./utils');
    const template = elementTemplates.find(t => changeToCase(t.name || '', 'camelCase') === selectedOption);
    if (template) {
      const element = generateElement({
        artifact,
        cqlOption: null,
        externalCqlList,
        option: selectedOption,
        subOption: null,
        template,
        vsacCode: vsacType === 'codes' ? (vsacData as CodeSelection) : null,
        vsacValueSet: vsacType === 'valueSets' ? (vsacData as ValueSetSelection) : null,
        vsacType
      });
      if (element) {
        handleAddElement(element as Instance);
        setSelectedOption(null);
        setSelectedSubOption(null);
        setSelectedCqlOption(null);
      }
    }
  };

  const handleClose = (): void => {
    setSelectedOption(null);
    setSelectedSubOption(null);
    setSelectedCqlOption(null);
  };

  return (
    <Card className={background} style={{ marginTop: '10px' }}>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ElementSelectDropdown
            options={elementOptions}
            handleSelectOption={(value: string) => handleSelectOption(value)}
            isDisabled={isDisabled}
            label="Select Element Type"
            value={selectedOption}
            showFooter={false}
          />

          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>

        {selectedOptionData && (
          <>
            {selectedOptionData.options &&
              Array.isArray(selectedOptionData.options) &&
              selectedOptionData.options.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <ElementSelectDropdown
                    options={selectedOptionData.options}
                    handleSelectOption={(value: string) => handleSelectSubOption(value)}
                    isDisabled={isDisabled}
                    label={
                      selectedOptionData.value === 'baseElements'
                        ? 'Base Element'
                        : selectedOptionData.value === 'parameters'
                          ? 'Parameters Element'
                          : selectedOptionData.value === 'externalCql'
                            ? 'External CQL Element'
                            : `${selectedOptionData.label} Element`
                    }
                    value={selectedSubOption}
                    showFooter={false}
                  />
                </div>
              )}
            {selectedOption === 'externalCql' &&
              selectedSubOption &&
              selectedOptionData.options &&
              Array.isArray(selectedOptionData.options) &&
              (() => {
                const selectedCqlLibrary = (
                  selectedOptionData.options as Array<{
                    value: string;
                    options?: Array<{
                      value: string;
                      label: string;
                      [key: string]: string | number | boolean | React.ReactNode | undefined;
                    }>;
                  }>
                ).find(opt => opt.value === selectedSubOption);
                return selectedCqlLibrary &&
                  selectedCqlLibrary.options &&
                  Array.isArray(selectedCqlLibrary.options) &&
                  selectedCqlLibrary.options.length > 0 ? (
                  <div style={{ marginTop: '10px' }}>
                    <ElementSelectDropdown
                      options={selectedCqlLibrary.options}
                      handleSelectOption={(value: string) => handleSelectCqlOption(value)}
                      isDisabled={isDisabled}
                      label="Definition, function, or parameter"
                      value={selectedCqlOption}
                      showFooter={false}
                    />
                  </div>
                ) : null;
              })()}
            {VSAC_OPTIONS.includes(selectedOptionData.value as (typeof VSAC_OPTIONS)[number]) && (
              <ElementSelectActions handleSelectElement={handleSelectElement} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ElementSelect;
