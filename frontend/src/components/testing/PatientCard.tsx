import React from 'react';
import { AccountCircle as AccountCircleIcon } from '@mui/icons-material';

import { getPatientAge, getPatientFullName, getPatientGender } from 'utils/patients';
import type { PatientData } from '../../types/patient';
import useStyles from './styles';

interface PatientCardProps {
  patient: PatientData;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const styles = useStyles();

  return (
    <div className={styles.patientCard}>
      <AccountCircleIcon className={styles.patientCardIcon} />

      <div>
        <div className={styles.patientCardName}>{getPatientFullName(patient)}</div>

        <div className={styles.patientCardDemographics}>
          <div>{getPatientGender(patient)}</div>
          <div>{getPatientAge(patient)}</div>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;


