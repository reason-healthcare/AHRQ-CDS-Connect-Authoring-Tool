import axios from 'axios';
import type { Artifact } from '../../types/artifact';

interface FetchArtifactParams {
  artifactId: string;
}

const fetchArtifact = async ({ artifactId }: FetchArtifactParams): Promise<Artifact> => {
  const { data } = await axios.get<Artifact[]>(`${process.env.REACT_APP_API_URL}/artifacts/${artifactId}`);

  return data[0];
};

export default fetchArtifact;
