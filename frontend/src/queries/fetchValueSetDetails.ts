import axios, { AxiosError } from 'axios';
import type { ValueSetDetails } from '../types/query';

interface FetchValueSetDetailsParams {
  oid: string;
  apiKey: string;
}

const fetchValueSetDetails = async ({ oid, apiKey }: FetchValueSetDetailsParams): Promise<ValueSetDetails['codes']> => {
  try {
    const { data } = await axios.get<ValueSetDetails>(`${process.env.REACT_APP_API_URL}/fhir/vs/${oid}`, {
      auth: { username: '', password: apiKey }
    });

    return data.codes;
  } catch (error) {
    if ((error as AxiosError)?.response?.status === 404) {
      throw new Error('Unable to retrieve codes for this value set.');
    }
    throw error;
  }
};

export default fetchValueSetDetails;
