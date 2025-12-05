import React, { useMemo, useState } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Check as CheckIcon, Lock as LockIcon } from '@mui/icons-material';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../store/hooks';

import PatientsTableRow from './PatientsTableRow';
import ExecuteCQLModal from './modals/ExecuteCQLModal';
import { HelpLink } from 'components/elements';
import { VSACAuthenticationModal } from 'components/modals';
import { sortAlphabeticallyByPatientName } from 'utils/sort';
import type { PatientData } from '../../types/patient';
import type { Artifact, DataModel } from '../../types/artifact';
import { useSpacingStyles, useTableStyles } from 'styles/hooks';
import useStyles from './styles';

interface ExecuteCQLParams {
  artifact: Artifact;
  params: Array<{ name: string; type: string; value: unknown }>;
  dataModel: DataModel;
  selectedPatients: PatientData[];
}

interface PatientsTableProps {
  handleExecuteCQL: (params: ExecuteCQLParams) => Promise<void>;
  patients: PatientData[];
}

const PatientsTable: React.FC<PatientsTableProps> = ({ handleExecuteCQL, patients }) => {
  const [selectedPatients, setSelectedPatients] = useState<PatientData[]>([]);
  const [showExecuteCQLModal, setShowExecuteCQLModal] = useState(false);
  const [showVSACAuthenticationModal, setShowVSACAuthenticationModal] = useState(false);
  const vsacApiKey = useAppSelector(state => state.vsac.apiKey);
  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => sortAlphabeticallyByPatientName(a as never, b as never)),
    [patients]
  );
  const spacingStyles = useSpacingStyles();
  const tableStyles = useTableStyles();
  const styles = useStyles();

  const togglePatient = (patient: PatientData): void => {
    setSelectedPatients(currentSelectedPatients => {
      const newSelectedPatients = [...currentSelectedPatients];
      const patientIndex = newSelectedPatients.findIndex(p => p._id === patient._id);
      if (patientIndex !== -1) newSelectedPatients.splice(patientIndex, 1);
      else newSelectedPatients.push(patient);

      return newSelectedPatients;
    });
  };

  const executeCql = (props: ExecuteCQLParams): void => {
    setSelectedPatients([]);
    handleExecuteCQL(props);
  };

  return (
    <div className={spacingStyles.verticalPadding} id="patients-table">
      <div className={styles.helpLinkRow}>
        <div className={styles.patientsTableButtons}>
          <Button
            color="primary"
            disabled={Boolean(vsacApiKey)}
            onClick={() => setShowVSACAuthenticationModal(true)}
            variant="contained"
            startIcon={Boolean(vsacApiKey) ? <CheckIcon /> : <LockIcon />}
          >
            {Boolean(vsacApiKey) ? 'VSAC Authenticated' : 'Authenticate VSAC'}
          </Button>

          <Button
            color="primary"
            disabled={!Boolean(vsacApiKey) || selectedPatients.length === 0}
            onClick={() => setShowExecuteCQLModal(true)}
            variant="contained"
          >
            Execute CQL on Selected Patients
          </Button>
        </div>

        <div className={styles.helpLink}>
          <HelpLink linkPath="documentation/userguide#Testing_Artifacts" showText />
        </div>
      </div>

      <TableContainer>
        <Table aria-label="patients table">
          <TableHead>
            <TableRow className={tableStyles.noWrapRow}>
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Birth Date</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {patients.length > 0 ? (
              sortedPatients.map(patient => (
                <PatientsTableRow
                  key={patient._id}
                  patient={patient}
                  isSelected={selectedPatients.some(p => p._id === patient._id)}
                  isDisabled={selectedPatients.length > 0 && selectedPatients[0].fhirVersion !== patient.fhirVersion}
                  togglePatient={() => togglePatient(patient)}
                />
              ))
            ) : (
              <TableRow>
                <TableCell>No patients to show.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showVSACAuthenticationModal && (
        <VSACAuthenticationModal handleCloseModal={() => setShowVSACAuthenticationModal(false)} />
      )}

      {showExecuteCQLModal && (
        <ExecuteCQLModal
          patients={selectedPatients as never}
          handleCloseModal={() => setShowExecuteCQLModal(false)}
          handleExecuteCQL={executeCql as never}
        />
      )}
    </div>
  );
};

export default PatientsTable;
