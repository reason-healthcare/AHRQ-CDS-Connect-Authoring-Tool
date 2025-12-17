import React, { useMemo } from 'react';
import { IconButton, Paper } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import TestResultsSection from './TestResultsSection';
import { KeyValueList } from 'components/elements';
import { getPatientId, getPatientFullName } from 'utils/patients';
import type { Artifact } from '../../types/artifact';
import type { ElmFile, CqlFile } from '../../types/query';
import type { FHIRBundle } from '../../types/patient';
import { useSpacingStyles } from 'styles/hooks';
import useStyles from './styles';

export interface PatientResult {
  MeetsInclusionCriteria?: boolean | null;
  MeetsExclusionCriteria?: boolean | null;
  Recommendation?: boolean | string | null;
  Rationale?: boolean | string | null;
  Errors?: boolean | string | null;
  [key: string]: boolean | string | number | null | undefined;
}

export interface TestResultsData {
  patientResults: Record<string, PatientResult>;
  [key: string]: Record<string, PatientResult> | boolean | string | number | null | undefined;
}

interface TestResultsProps {
  artifact: Artifact;
  handleOnClose: () => void;
  patientsExecuted: FHIRBundle[];
  results: TestResultsData;
  cqlFiles: CqlFile[];
  elmFiles: ElmFile[];
}

const TestResults: React.FC<TestResultsProps> = ({
  artifact,
  handleOnClose,
  patientsExecuted,
  results,
  cqlFiles,
  elmFiles
}) => {
  const spacingStyles = useSpacingStyles();
  const styles = useStyles();
  const resultsArray = useMemo(() => Object.values(results.patientResults), [results]);
  const resultsIncludedCount = useMemo(() => resultsArray.filter(r => r.MeetsInclusionCriteria).length, [resultsArray]);
  const resultsExcludedCount = useMemo(() => resultsArray.filter(r => r.MeetsExclusionCriteria).length, [resultsArray]);
  const resultsCount = resultsArray.length;

  const resultsMetaList = [
    { key: 'Artifact', value: artifact.name },
    { key: 'Meets Inclusion Criteria', value: `${resultsIncludedCount} of ${resultsCount} patients` },
    { key: 'Meets Exclusion Criteria', value: `${resultsExcludedCount} of ${resultsCount} patients` }
  ];

  return (
    <Paper className={styles.testResults}>
      <IconButton aria-label="close" className={styles.closeButton} onClick={handleOnClose} size="large">
        <CloseIcon />
      </IconButton>

      <div className={styles.testResultsTitle}>CQL Execution Results</div>
      <KeyValueList list={resultsMetaList} />

      <div className={spacingStyles.verticalPadding}>
        {patientsExecuted.map(patient => {
          const patientId = getPatientId({ patient });
          return (
            <TestResultsSection
              key={patientId || `patient-${Math.random()}`}
              patientName={getPatientFullName({ patient })}
              results={results.patientResults[patientId || ''] || {}}
              cqlFiles={cqlFiles}
              elmFiles={elmFiles}
            />
          );
        })}
      </div>
    </Paper>
  );
};

export default TestResults;
