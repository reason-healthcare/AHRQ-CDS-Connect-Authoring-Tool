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
import clsx from 'clsx';

import { useTextStyles } from 'styles/hooks';

import type { OtherResourceType } from '../../utils/patients';

interface PatientDataSectionProps {
  data: Array<Record<string, unknown> | OtherResourceType>;
  title: string;
}

const PatientDataSection: React.FC<PatientDataSectionProps> = ({ data, title }) => {
  const textStyles = useTextStyles();

  if (data.length === 0) return null;

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="patient-data-section-content"
        id="patient-data-section-header"
      >
        <>
          {title} ({data.length})
        </>
      </AccordionSummary>

      <AccordionDetails>
        {data && (
          <TableContainer>
            <Table aria-label="patient data section table" size="small">
              <TableHead>
                {title === 'Other' && data.length > 0 && (
                  <TableRow>
                    <TableCell className={textStyles.fontSizeSmall}>Resource type</TableCell>
                  </TableRow>
                )}

                {title !== 'Other' && data.length > 0 && (
                  <TableRow>
                    {Object.keys(data[0]).map((key, index) => (
                      <TableCell key={index} className={clsx(textStyles.noWrap, textStyles.fontSizeSmall)}>
                        {key}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableHead>

              <TableBody>
                {title === 'Other' &&
                  data.map((resource, index) => {
                    const r = resource as { resource: string; count: number };
                    return (
                      <TableRow key={index}>
                        <TableCell className={textStyles.fontSizeSmall}>
                          {r.resource} ({r.count})
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {title !== 'Other' &&
                  data.length > 0 &&
                  data.map((element, index) => (
                    <TableRow key={index}>
                      {Object.keys(data[0]).map((key, keyIndex) => (
                        <TableCell key={keyIndex} className={textStyles.fontSizeSmall}>
                          {String(element[key] ?? '')}
                        </TableCell>
                      ))}
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

export default PatientDataSection;
