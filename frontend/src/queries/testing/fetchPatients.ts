import axios from 'axios';

const fetchPatients = async (): Promise<Patient[]> => {
  const { data } = await axios.get<Patient[]>(`${process.env.REACT_APP_API_URL}/testing`);

  return data;
};

export default fetchPatients;
