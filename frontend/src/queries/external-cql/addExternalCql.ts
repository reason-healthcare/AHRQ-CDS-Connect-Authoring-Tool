import axios, { AxiosError } from 'axios';
import type { ExternalCqlLibrary } from '../../types/query';

interface AddExternalCqlError {
  statusText: string;
  cqlErrors: Array<{ message?: string; [key: string]: unknown }> | null;
}

interface AddExternalCqlLibrary {
  name?: string;
  [key: string]: unknown;
}

const addExternalCql = async (library: AddExternalCqlLibrary): Promise<ExternalCqlLibrary> => {
  try {
    const { data } = await axios.post<string | ExternalCqlLibrary | { n?: number; nModified?: number; ok?: number }>(
      `${process.env.REACT_APP_API_URL}/externalCQL`,
      {
        library
      }
    );
    // Handle string error responses (even with 200 status)
    if (typeof data === 'string') {
      if (/^Unable to upload/i.test(data) || /already includes/i.test(data)) {
        return Promise.reject({ statusText: data, cqlErrors: null } as AddExternalCqlError);
      }
    }
    // Handle MongoDB update result - return a minimal library object
    if (typeof data === 'object' && data !== null && 'n' in data && 'ok' in data) {
      return { _id: '', name: library.name } as ExternalCqlLibrary;
    }
    return data as ExternalCqlLibrary;
  } catch (error) {
    const axiosError = error as AxiosError<string | Array<{ message?: string; [key: string]: unknown }>>;
    const statusText = typeof axiosError.response?.data === 'string' ? axiosError.response.data : '';
    return Promise.reject({
      statusText,
      cqlErrors: Array.isArray(axiosError.response?.data) ? axiosError.response.data : null
    } as AddExternalCqlError);
  }
};

export default addExternalCql;
