import React, { useState } from 'react';
import { Button, Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

import TestResultsCqlModal from './modals/TestResultsCqlModal';
import { KeyValueList } from 'components/elements';
import type { ElmFile, CqlFile } from '../../types/query';
import type { PatientResult } from './TestResults';
import useStyles from './styles';

interface TestResultsSectionProps {
  patientName: string;
  results: PatientResult;
  cqlFiles: CqlFile[];
  elmFiles: ElmFile[];
}

const TestResultsSection: React.FC<TestResultsSectionProps> = ({ patientName, results, cqlFiles, elmFiles }) => {
  const [showTestResultsCqlModal, setShowTestResultsCqlModal] = useState(false);
  const styles = useStyles();

  const getValue = (result: unknown): React.ReactNode => {
    if (result == null) return 'No Value';
    if (result === true)
      return (
        <>
          <span className="sr-only">Yes</span>
          <CheckIcon className={styles.trueIcon} />
        </>
      );
    if (result === false)
      return (
        <>
          <span className="sr-only">No</span>
          <CloseIcon className={styles.falseIcon} />
        </>
      );
    return String(result);
  };

  const resultDetails = [
    { key: 'MeetsInclusionCriteria', value: getValue(results.MeetsInclusionCriteria) },
    { key: 'MeetsExclusionCriteria', value: getValue(results.MeetsExclusionCriteria) },
    { key: 'Recommendation', value: getValue(results.Recommendation) },
    { key: 'Rationale', value: getValue(results.Rationale) },
    { key: 'Errors', value: getValue(results.Errors) }
  ];

  return (
    <Accordion defaultExpanded className={styles.testResultsSection}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="results-data-section-content"
        id="results-data-section-header"
      >
        <>
          <AccountCircleIcon className={styles.testResultsPatientIcon} />
          <div className={styles.testResultsPatientName}>{patientName}</div>
        </>
      </AccordionSummary>

      <AccordionDetails>
        <KeyValueList dense list={resultDetails} />

        <div className={styles.testResultsButtonSection}>
          <Button
            color="primary"
            size="small"
            onClick={() => setShowTestResultsCqlModal(true)}
            startIcon={<VisibilityIcon />}
            variant="contained"
          >
            View Detailed Results
          </Button>
        </div>
      </AccordionDetails>

      {showTestResultsCqlModal && (
        <TestResultsCqlModal
          handleCloseModal={() => setShowTestResultsCqlModal(false)}
          results={results}
          cqlFiles={cqlFiles}
          elmFiles={elmFiles}
        />
      )}
    </Accordion>
  );
};

export default TestResultsSection;
