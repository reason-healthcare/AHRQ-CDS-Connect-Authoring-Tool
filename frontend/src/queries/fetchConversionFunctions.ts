import axios from 'axios';
import type { ConversionFunction } from '../types/query';

const fetchConversionFunctions = async (): Promise<ConversionFunction[]> => {
  const { data } = await axios.get<ConversionFunction[]>(`${process.env.REACT_APP_API_URL}/config/conversions`);

  return data;
};

export default fetchConversionFunctions;
