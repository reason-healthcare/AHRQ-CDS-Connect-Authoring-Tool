import axios from 'axios';
import type { Artifact } from '../../types/artifact';

const fetchArtifacts = async (): Promise<Artifact[]> => {
  const { data } = await axios.get<Artifact[]>(`${process.env.REACT_APP_API_URL}/artifacts`);

  return data;
};

export default fetchArtifacts;
