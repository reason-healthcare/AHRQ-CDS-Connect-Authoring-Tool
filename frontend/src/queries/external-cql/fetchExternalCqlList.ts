import axios from 'axios';
import type { ExternalCqlLibrary } from '../../types/query';

interface FetchExternalCqlListParams {
  artifactId: string;
}

const fetchExternalCqlList = async ({ artifactId }: FetchExternalCqlListParams): Promise<ExternalCqlLibrary[]> => {
  const { data } = await axios.get<ExternalCqlLibrary[]>(`${process.env.REACT_APP_API_URL}/externalCQL/${artifactId}`);

  return data;
};

export default fetchExternalCqlList;
