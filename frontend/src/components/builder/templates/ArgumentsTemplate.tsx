import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';
import { useQuery } from '@tanstack/react-query';
import { Box, Divider, Stack } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

import EditorsTemplate from './EditorsTemplate';
import ElementCardLabel from 'components/elements/ElementCard/ElementCardLabel';
import { Dropdown } from 'components/elements';
import { isSupportedEditorType } from 'components/builder/editors/utils';
import { getBaseElementById, getBaseElementName, getBaseElementsByType } from 'components/builder/base-elements/utils';
import { getParameterById, getParametersByType } from 'components/builder/parameters/utils';
import { getExternalCqlByType } from 'components/builder/external-cql/utils';
import { fetchExternalCqlList } from 'queries/external-cql';
import { changeToCase } from 'utils/strings';
import type { BaseElement, Parameter } from '../../../types/artifact';
import type { ExternalCqlLibrary } from '../../../types/query';

interface ArgumentValue {
  argSource?: string;
  selected?: string;
  elementName?: string;
  elementType?: string;
  type?: string;
  [key: string]: unknown;
}

interface ArgumentsTemplateProps {
  argumentLabel: string;
  argumentType: string;
  argumentValue?: ArgumentValue;
  handleUpdateArgument: (value: ArgumentValue) => void;
  isNested?: boolean;
}

const ArgumentsTemplate: React.FC<ArgumentsTemplateProps> = ({
  argumentLabel,
  argumentType,
  argumentValue,
  handleUpdateArgument,
  isNested
}) => {
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { baseElements, parameters } = artifact;
  const query = { artifactId: artifact._id };
  const { data: externalCqlList } = useQuery<ExternalCqlLibrary[]>({
    queryKey: ['externalCql', query],
    queryFn: () => fetchExternalCqlList(query)
  });

  const sourceOptions = [
    {
      value: 'baseElement',
      label: 'Base Element',
      isDisabled: getBaseElementsByType(baseElements, argumentType).length === 0
    },
    { value: 'editor', label: 'Editor', isDisabled: !isSupportedEditorType(argumentType) },
    {
      value: 'externalCql',
      label: 'External CQL',
      isDisabled: getExternalCqlByType(externalCqlList, argumentType).length === 0
    },
    {
      value: 'parameter',
      label: 'Parameter',
      isDisabled: getParametersByType(parameters, argumentType).length === 0
    }
  ];

  const matchingParameters = getParametersByType(parameters, argumentType).map((parameter: Parameter) => ({
    value: parameter.uniqueId,
    label: parameter.name
  }));

  const matchingBaseElements = getBaseElementsByType(baseElements, argumentType).map((baseElement: BaseElement) => ({
    value: baseElement.uniqueId,
    label: getBaseElementName(baseElement)
  }));

  const matchingExternalCQL = getExternalCqlByType(externalCqlList, argumentType).map(
    (externalCQLElement: { libraryName: string; elementName: string; type: string }) => ({
      value: `"${externalCQLElement.libraryName}"."${externalCQLElement.elementName}"`,
      label: `${externalCQLElement.elementName} | ${
        externalCQLElement.type === 'function' ? 'function(0) | ' : ''
      } ${argumentType}`,
      type: externalCQLElement.type,
      library: externalCQLElement.libraryName,
      element: externalCQLElement.elementName
    })
  );

  const getLibraryOptions = (matchingExternalCQLArray: typeof matchingExternalCQL) => {
    const uniqueLibraryNames = [...new Set(matchingExternalCQLArray.map(elem => elem.library))];
    return uniqueLibraryNames.map(name => ({ value: `${name}`, label: name }));
  };

  const handleSelectArgument = (argSource: string): void => {
    // if base element source is selected and there is exactly one base element, select it
    if (argSource === 'baseElement' && matchingBaseElements.length === 1)
      handleUpdateArgument({
        argSource,
        selected: String(matchingBaseElements[0].value),
        elementName: String(matchingBaseElements[0].label)
      });
    // else if externalCql source is selected and there is exactly one library, select it
    else if (argSource === 'externalCql' && getLibraryOptions(matchingExternalCQL).length === 1)
      handleUpdateArgument({
        argSource,
        selected: getLibraryOptions(matchingExternalCQL)[0].value
      });
    // else if parameter source is selected and there is exactly one parameter, select it
    else if (argSource === 'parameter' && matchingParameters.length === 1)
      handleUpdateArgument({
        argSource,
        selected: matchingParameters[0].value,
        elementName: matchingParameters[0].label
      });
    // else select the source
    else handleUpdateArgument({ argSource, type: argumentType });
  };

  return (
    <Stack direction="row">
      <ElementCardLabel label={argumentLabel} mt="15px" />

      <Stack width="100%">
        <Dropdown
          Footer={
            sourceOptions.some(sourceOption => sourceOption.isDisabled) && (
              <>
                <BlockIcon fontSize="small" sx={{ marginRight: '5px' }} />
                No available elements
              </>
            )
          }
          label="Argument Source"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSelectArgument(event.target.value)}
          options={sourceOptions}
          renderItem={option => (
            <>
              {option.label}
              {option.isDisabled && <BlockIcon fontSize="small" />}
            </>
          )}
          sx={{ width: { xs: '200px', xxl: '300px' } }}
          value={argumentValue?.argSource || ''}
        />
        {argumentValue?.argSource === 'editor' && (
          <EditorsTemplate
            errors={undefined}
            handleUpdateEditor={(newSelection: string | number | boolean | null | undefined) =>
              handleUpdateArgument({
                ...argumentValue,
                selected: typeof newSelection === 'string' ? newSelection : String(newSelection ?? '')
              })
            }
            label=""
            type={argumentType}
            value={argumentValue?.selected}
          />
        )}
        {(argumentValue?.argSource === 'baseElement' || argumentValue?.argSource === 'parameter') && (
          <Dropdown
            label={argumentValue.argSource === 'baseElement' ? 'Base Element' : 'Parameter'}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleUpdateArgument({
                ...argumentValue,
                selected: String(event.target.value),
                elementName: (() => {
                  if (argumentValue.argSource === 'baseElement') {
                    const baseElement = getBaseElementById(baseElements, String(event.target.value));
                    const name = baseElement ? getBaseElementName(baseElement) : null;
                    return typeof name === 'string' ? name : String(name);
                  } else {
                    return getParameterById(parameters, String(event.target.value))?.name;
                  }
                })()
              });
            }}
            options={
              argumentValue.argSource === 'baseElement'
                ? matchingBaseElements.map(opt => ({ label: String(opt.label), value: String(opt.value) }))
                : matchingParameters.map(opt => ({ label: String(opt.label), value: String(opt.value) }))
            }
            sx={{ width: { xs: '400px', xxl: '600px' } }}
            value={argumentValue?.selected || ''}
          />
        )}
        {argumentValue?.argSource === 'externalCql' && (
          <Dropdown
            label="External CQL Library"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleUpdateArgument({
                ...argumentValue,
                selected: event.target.value
              });
            }}
            options={getLibraryOptions(matchingExternalCQL)}
            sx={{ width: { xs: '400px', xxl: '600px' } }}
            value={argumentValue?.selected || ''}
          />
        )}
        {argumentValue?.argSource === 'externalCql' && argumentValue?.selected && argumentValue?.selected !== '' && (
          <Dropdown
            label="Definition, function, or parameter"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const matchingElement = matchingExternalCQL.find(elem => elem.value === event.target.value);
              handleUpdateArgument({
                ...argumentValue,
                elementName: event.target.value,
                elementType: matchingElement?.type ? String(matchingElement.type) : undefined
              });
            }}
            options={matchingExternalCQL.filter(elem => elem.library === argumentValue.selected)}
            sx={{ width: { xs: '400px', xxl: '600px' } }}
            value={argumentValue?.elementName || ''}
          />
        )}

        <Box color="common.grayLight" fontSize="0.7em" textAlign="right">
          Argument Type: {changeToCase(argumentType, 'capitalCase')}
        </Box>

        <Divider sx={{ marginBottom: '10px' }} />
      </Stack>
    </Stack>
  );
};

export default ArgumentsTemplate;
