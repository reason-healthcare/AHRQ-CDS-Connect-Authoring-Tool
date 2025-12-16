import React from 'react';
import { Box, Divider, IconButton, Stack } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';

import ElementCardLabel from 'components/elements/ElementCard/ElementCardLabel';
import { setActiveTab, setScrollToId } from 'actions/navigation';
// eslint-disable-next-line import/no-unresolved
import { useAppDispatch } from '../../../store/hooks';
import { getTabIndexFromName, getTabNameFromIndex } from '../utils';
import type { Field } from '../../../types/artifact';

interface ElementName {
  id: string;
  name: string;
}

interface ReferenceTemplateProps {
  elementNames: ElementName[];
  referenceField: Field & {
    value?: {
      id?: string;
      elementName?: string;
    };
  };
  referenceInstanceTab: string;
}

const ReferenceTemplate: React.FC<ReferenceTemplateProps> = ({
  elementNames,
  referenceField,
  referenceInstanceTab
}) => {
  const dispatch = useAppDispatch();

  const baseElementTabIndex = getTabIndexFromName('baseElements');
  const parameterTabIndex = getTabIndexFromName('parameters');
  const referenceTabIndex = getTabIndexFromName(referenceInstanceTab);

  const getReferenceName = (): string => {
    switch (referenceField.id) {
      case 'externalCqlReference':
        return (referenceField.value as { id?: string })?.id || '';
      case 'baseElementArgumentReference':
      case 'parameterArgumentReference':
        return (referenceField.value as { elementName?: string })?.elementName || '';
      default:
        return elementNames.find(name => name.id === (referenceField.value as { id?: string })?.id)?.name || '';
    }
  };

  const referenceLabelMap: Record<string, string> = {
    baseElementArgumentReference: 'Base Element',
    baseElementReference: 'Base Element',
    baseElementUse: 'Element Use',
    externalCqlReference: 'External CQL Element',
    parameterArgumentReference: 'Parameter',
    parameterReference: 'Parameter',
    parameterUse: 'Parameter Use'
  };

  const handleLinkToElement = (): void => {
    let activeTabIndex = 0;
    if (referenceField.id === 'baseElementReference' || referenceField.id === 'baseElementArgumentReference')
      activeTabIndex = baseElementTabIndex;
    else if (referenceField.id === 'parameterReference' || referenceField.id === 'parameterArgumentReference')
      activeTabIndex = parameterTabIndex;
    else if (referenceField.id === 'baseElementUse' || referenceField.id === 'parameterUse')
      activeTabIndex = referenceTabIndex;
    if (activeTabIndex == null) return;

    dispatch(setScrollToId((referenceField.value as { id?: string })?.id || ''));
    dispatch(setActiveTab(activeTabIndex));
  };

  const isUse = referenceField.id === 'baseElementUse' || referenceField.id === 'parameterUse';

  return (
    <Stack alignItems="center" direction="row">
      <ElementCardLabel label={referenceLabelMap[referenceField.id] || ''} />

      <Stack width="100%">
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Box my={1}>
            {getReferenceName()} {isUse && <>&#8594; {getTabNameFromIndex(referenceTabIndex)}</>}
          </Box>

          {referenceField.id !== 'externalCqlReference' && (
            <IconButton aria-label="see element definition" color="primary" onClick={handleLinkToElement}>
              <LinkIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Divider />
      </Stack>
    </Stack>
  );
};

export default ReferenceTemplate;
