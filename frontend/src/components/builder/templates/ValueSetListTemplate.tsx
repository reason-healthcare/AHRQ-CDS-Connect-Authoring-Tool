import React, { useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';
import { Box, Divider, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

import ElementCardLabel from 'components/elements/ElementCard/ElementCardLabel';
import { ValueSetSelectModal } from 'components/modals';
import { Tooltip } from 'components/elements';

export interface ValueSet {
  name: string;
  oid: string;
  [key: string]: unknown;
}

export interface ValueSetListTemplateProps {
  handleDeleteValueSet: (valueSet: ValueSet) => void;
  valueSets: ValueSet[];
}

const ValueSetListTemplate: React.FC<ValueSetListTemplateProps> = ({ handleDeleteValueSet, valueSets }) => {
  const [showValueSetViewModal, setShowValueSetViewModal] = useState(false);
  const [valueSetToView, setValueSetToView] = useState<ValueSet | null>(null);
  const vsacApiKey = useAppSelector(state => state.vsac.apiKey);

  const handleViewValueSet = (valueSet: ValueSet): void => {
    setValueSetToView(valueSet);
    setShowValueSetViewModal(true);
  };

  return (
    <div id="value-set-list-template">
      {valueSets.map((valueSet, index) => (
        <Stack key={`value-set-${index}`} direction="row" mb={1}>
          <ElementCardLabel
            id="value-set-label"
            label={`Value Set${valueSets.length > 1 ? ` ${index + 1}` : ''}`}
            mt="6px"
          />

          <Stack width="100%">
            <Stack alignItems="center" direction="row" justifyContent="space-between" mb={1}>
              {` ${valueSet.name} (${valueSet.oid})`}

              <Box>
                <Tooltip enabled={!Boolean(vsacApiKey)} placement="left" title="Authenticate VSAC to view details">
                  <IconButton
                    aria-label="View Value Set"
                    color="primary"
                    disabled={!Boolean(vsacApiKey)}
                    onClick={() => handleViewValueSet(valueSet)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <IconButton
                  aria-label={`Delete Value Set ${valueSet.name}`}
                  color="primary"
                  onClick={() => handleDeleteValueSet(valueSet)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Stack>

            <Divider />
          </Stack>
        </Stack>
      ))}

      {showValueSetViewModal && valueSetToView && (
        <ValueSetSelectModal
          handleCloseModal={() => setShowValueSetViewModal(false)}
          readOnly
          savedValueSet={valueSetToView}
        />
      )}
    </div>
  );
};

export default ValueSetListTemplate;
