import axios from 'axios';
import type { Artifact } from '../../types/artifact';

interface DuplicateArtifactParams {
  artifactProps: { _id: string };
}

const duplicateArtifact = async ({ artifactProps }: DuplicateArtifactParams): Promise<Artifact> => {
  return axios
    .post<Artifact>(`${process.env.REACT_APP_API_URL}/artifacts/${artifactProps._id}/duplicate`)
    .then(result => result.data);
};

export default duplicateArtifact;
