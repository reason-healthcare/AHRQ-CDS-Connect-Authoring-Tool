import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Alert, CircularProgress } from '@mui/material';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../store/hooks';

import PatientDropZone from './PatientDropZone';
import PatientsTable from './PatientsTable';
import TestResults, { type TestResultsData } from './TestResults';
import { ELMErrorModal } from 'components/modals';
import type { ELMError } from 'components/modals/ELMErrorModal';
import { executeArtifact, fetchPatients, validateArtifact } from 'queries/testing';
import type { Artifact, DataModel, Parameter } from '../../types/artifact';
import type { PatientData } from '../../types/patient';
import type { ElmFile, CqlFile } from '../../types/query';
import { useSpacingStyles } from 'styles/hooks';
import CodeService from 'utils/code_service/CodeService';
import useStyles from './styles';

export const validate404ErrorMessage = 'Unable to retrieve codes for a value set in this artifact.';

interface TestResultsState {
  results: TestResultsData;
  patientsExecuted: PatientData[];
  artifact: Artifact;
  elmFiles: ElmFile[];
  cqlFiles: CqlFile[];
}

interface ExecuteCQLParams {
  artifact: Artifact;
  params: Parameter[];
  dataModel: DataModel;
  selectedPatients: PatientData[];
}

const Tester: React.FC = () => {
  const [elmErrors, setElmErrors] = useState<unknown[] | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResultsState | null>(null);
  const codeService = useMemo(() => new CodeService(), []);
  const { data: patients, isLoading: patientsIsLoading } = useQuery<PatientData[]>({
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

  const handleExecuteCQL = async (params: ExecuteCQLParams): Promise<void> => {
    const { artifact, params: executeParams, dataModel, selectedPatients } = params;
    setElmErrors(null);
    setExecutionError(null);
    setTestResults(null);

    let elmFiles: ElmFile[] | undefined;
    let validationElmErrors: unknown[] | undefined;
    let cqlFiles: unknown = undefined;
    try {
      const validationResult = await asyncValidateArtifact({ artifact, dataModel });
      elmFiles = (validationResult as { elmFiles?: ElmFile[] }).elmFiles;
      validationElmErrors = (validationResult as { elmErrors?: ELMError[] }).elmErrors;
      cqlFiles = (validationResult as { cqlFiles?: unknown }).cqlFiles;
      if (validationElmErrors && validationElmErrors.length > 0) setElmErrors(validationElmErrors);
    } catch (error) {
      const axiosError = error as { response?: { status?: number }; message?: string };
      setExecutionError(
        axiosError.response?.status === 404
          ? validate404ErrorMessage
          : `Validation error: ${axiosError.message || 'Unknown error'}`
      );
      return;
    }

    if (!elmFiles) {
      setExecutionError('Validation succeeded but no ELM files were returned');
      return;
    }

    try {
      const results = await asyncExecuteArtifact({
        elmFiles,
        artifact,
        dataModel,
        params: executeParams,
        patients: selectedPatients.map(
          p => p.patient || { type: 'collection', entry: p.entry || [], resourceType: 'Bundle' as const }
        ),
        vsacApiKey: vsacApiKey || '',
        codeService: codeService as unknown as {
          ensureValueSets: (
            valueSets: Array<{ name: string; id: string; version?: string }>,
            apiKey: string
          ) => Promise<void>;
        } & Record<string, unknown>
      });
      setTestResults({
        results: results as TestResultsData,
        patientsExecuted: selectedPatients,
        artifact,
        elmFiles,
        cqlFiles: cqlFiles || []
      } as TestResultsState);
    } catch (error) {
      const axiosError = error as { message?: string };
      setExecutionError(`Execution failed. Error: ${axiosError.message || 'Unknown error'}`);
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

      {!patientsIsLoading && <PatientsTable patients={patients || []} handleExecuteCQL={handleExecuteCQL} />}

      {elmErrors && <ELMErrorModal errors={elmErrors as ELMError[]} handleCloseModal={() => setElmErrors(null)} />}
    </div>
  );
};

export default Tester;
