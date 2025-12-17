import axios from 'axios';
import type { PatientBundle } from '../../types/patient';

interface AddPatientParams {
  patient: PatientBundle;
  fhirVersion: string;
}

const addPatient = async ({ patient, fhirVersion }: AddPatientParams): Promise<Patient> => {
  return axios
    .post<Patient>(`${process.env.REACT_APP_API_URL}/testing`, { patient, fhirVersion })
    .then(result => result.data);
};

export default addPatient;
