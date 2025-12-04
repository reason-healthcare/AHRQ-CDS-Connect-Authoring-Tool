import axios from 'axios';

interface TypeConversionData {
  FHIRToSystem?: Record<string, string>;
  [key: string]: unknown;
}

const fetchTypeConversionData = async (): Promise<TypeConversionData> => {
  const { data } = await axios.get<TypeConversionData>(`${process.env.REACT_APP_API_URL}/query/implicitconversion`);

  return data;
};

export default fetchTypeConversionData;
