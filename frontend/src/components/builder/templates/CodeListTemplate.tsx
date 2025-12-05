import React from 'react';
import { Box, Divider, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import ElementCardLabel from 'components/elements/ElementCard/ElementCardLabel';

interface Code {
  code: string;
  display?: string;
  codeSystem: {
    name: string;
    id?: string;
  };
}

interface CodeListTemplateProps {
  codes: Code[];
  handleDeleteCode: (code: Code) => void;
}

const CodeListTemplate: React.FC<CodeListTemplateProps> = ({ codes, handleDeleteCode }) => (
  <div id="code-list-template">
    {codes.map((code, index) => (
      <Stack key={`code-${index}`} direction="row" mb={1}>
        <ElementCardLabel id="code-label" label={`Code${codes.length > 1 ? ` ${index + 1}` : ''}`} mt="6px" />

        <Stack width="100%">
          <Stack alignItems="center" direction="row" justifyContent="space-between" mb={1}>
            {`${code.codeSystem.name} (${code.code}) ${code.display === '' ? '' : ` - ${code.display}`}`}

            <Box>
              <IconButton
                aria-label={`delete code ${code.codeSystem.name} (${code.code})`}
                color="primary"
                onClick={() => handleDeleteCode(code)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Stack>

          <Divider />
        </Stack>
      </Stack>
    ))}
  </div>
);

export default CodeListTemplate;
