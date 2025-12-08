import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

import { changeToCase } from 'utils/strings';

interface Definition {
  name?: string;
  operand?: Array<{ name?: string; [key: string]: unknown }>;
  displayReturnType?: string;
  calculatedReturnType?: string;
  [key: string]: unknown;
}

interface ExternalCqlDetailsModalSectionProps {
  definitions: Definition[];
  title: string;
}

const ExternalCqlDetailsModalSection: React.FC<ExternalCqlDetailsModalSectionProps> = ({ definitions, title }) => {
  return (
    <Accordion expanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="external-cql-section-content"
        id="external-cql-section-header"
      >
        <>
          {title} ({definitions.length})
        </>
      </AccordionSummary>

      <AccordionDetails>
        {definitions && (
          <TableContainer>
            <Table aria-label="external cql details table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  {title === 'Functions' && <TableCell>Arguments</TableCell>}
                  <TableCell>Return Type</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {definitions.map((definition, index) => (
                  <TableRow key={index}>
                    <TableCell>{definition.name}</TableCell>
                    {title === 'Functions' && (
                      <TableCell>{definition.operand?.map(op => op.name).join(' | ') || ''}</TableCell>
                    )}
                    <TableCell>
                      {definition.displayReturnType
                        ? definition.displayReturnType
                        : changeToCase(definition.calculatedReturnType || '', 'capitalCase')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ExternalCqlDetailsModalSection;
