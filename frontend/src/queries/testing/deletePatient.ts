import axios from 'axios';

interface DeletePatientParams {
  patient: { _id: string };
}

const deletePatient = async ({ patient }: DeletePatientParams): Promise<void> => {
  await axios.delete(`${process.env.REACT_APP_API_URL}/testing/${patient._id}`);
};

export default deletePatient;
