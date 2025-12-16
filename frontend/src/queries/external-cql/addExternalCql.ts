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
    // First try with default response handling (may be JSON or string)
    const response = await axios.post<unknown>(`${process.env.REACT_APP_API_URL}/externalCQL`, {
      library
    });
    const data = response.data;
    // Handle string error responses (even with 200 status)
    // Check if data is a string or if it's been parsed as an object but contains error text
    const dataString = typeof data === 'string' ? data : String(data);
    if (typeof data === 'string' || (typeof data === 'object' && data !== null && !('_id' in data) && !('n' in data))) {
      if (/^Unable to upload/i.test(dataString) || /already includes/i.test(dataString)) {
        return Promise.reject({ statusText: dataString, cqlErrors: null } as AddExternalCqlError);
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
