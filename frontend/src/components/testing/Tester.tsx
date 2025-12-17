import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Alert, CircularProgress } from '@mui/material';

import { useAppSelector } from '../../store/hooks';

import PatientDropZone from './PatientDropZone';
import PatientsTable from './PatientsTable';
import TestResults, { type TestResultsData } from './TestResults';
import { ELMErrorModal } from 'components/modals';
import type { ELMError } from 'components/modals/ELMErrorModal';
import { executeArtifact, fetchPatients, validateArtifact } from 'queries/testing';
import type { Artifact } from '../../types/artifact';
import type { FHIRBundle, PatientData } from '../../types/patient';
import type { ElmFile, CqlFile } from '../../types/query';
import { useSpacingStyles } from 'styles/hooks';
import CodeService from 'utils/code_service/CodeService';
import useStyles from './styles';

export const validate404ErrorMessage = 'Unable to retrieve codes for a value set in this artifact.';

interface TestResultsState {
  results: TestResultsData;
  patientsExecuted: FHIRBundle[];
  artifact: Artifact;
  elmFiles: ElmFile[];
  cqlFiles: CqlFile[];
}

const Tester: React.FC = () => {
  const [elmErrors, setElmErrors] = useState<unknown[] | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResultsState | null>(null);
  const codeService = useMemo(() => new CodeService(), []);
  const { data: patients, isLoading: patientsIsLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => fetchPatients()
  });
  const { mutateAsync: asyncValidateArtifact, isPending: isValidating } = useMutation({
    mutationFn: validateArtifact
  });
  const { mutateAsync: asyncExecuteArtifact, isPending: isExecuting } = useMutation({
    mutationFn: executeArtifact
  });
  const vsacApiKey = useAppSelector(state => state.vsac.apiKey);
  const spacingStyles = useSpacingStyles();
  const styles = useStyles();

  const handleExecuteCQL = async ({ artifact, params, dataModel, selectedPatients }) => {
    setElmErrors(null);
    setExecutionError(null);
    setTestResults(null);

    let elmFiles, validationElmErrors, cqlFiles;
    try {
      ({ elmFiles, elmErrors: validationElmErrors, cqlFiles } = await asyncValidateArtifact({ artifact, dataModel }));
      if (validationElmErrors?.length > 0) setElmErrors(validationElmErrors);
    } catch (error) {
      setExecutionError(
        error.response?.status === 404 ? validate404ErrorMessage : `Validation error: ${error.message}`
      );
      return;
    }

    try {
      const results = await asyncExecuteArtifact({
        elmFiles,
        artifact,
        dataModel,
        params,
        patients: selectedPatients,
        vsacApiKey,
        codeService: codeService as any
      });
      setTestResults({
        results: results as TestResultsData,
        patientsExecuted: selectedPatients,
        artifact,
        elmFiles,
        cqlFiles
      });
    } catch (error) {
      setExecutionError(`Execution failed. Error: ${error.message}`);
    }
  };

  return (
    <div className={spacingStyles.globalPadding} id="tester maincontent">
      <PatientDropZone />

      {executionError && (
        <Alert className={spacingStyles.verticalPadding} severity="error">
          {executionError}
        </Alert>
      )}

      {(isExecuting || isValidating || patientsIsLoading) && (
        <div className={spacingStyles.center}>
          <CircularProgress />
        </div>
      )}

      {!testResults && !isExecuting && !patientsIsLoading && (
        <div className={styles.testerInstructions}>
          {!Boolean(vsacApiKey)
            ? 'Log in to VSAC to execute CQL.'
            : 'Select one or more patients below and execute CQL.'}
        </div>
      )}

      {testResults && (
        <TestResults
          artifact={testResults.artifact}
          handleOnClose={() => setTestResults(null)}
          patientsExecuted={testResults.patientsExecuted}
          results={testResults.results}
          cqlFiles={testResults.cqlFiles}
          elmFiles={testResults.elmFiles}
        />
      )}

      {!patientsIsLoading && <PatientsTable patients={patients as PatientData[]} handleExecuteCQL={handleExecuteCQL} />}

      {elmErrors && <ELMErrorModal errors={elmErrors as ELMError[]} handleCloseModal={() => setElmErrors(null)} />}
    </div>
  );
};

export default Tester;
