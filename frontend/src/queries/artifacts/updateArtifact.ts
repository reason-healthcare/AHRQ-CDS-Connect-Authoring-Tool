import axios from 'axios';
import type { Artifact } from '../../types/artifact';

interface UpdateArtifactParams {
  artifact: Artifact;
  artifactProps?: Partial<Artifact>;
}

const updateArtifact = async ({ artifact, artifactProps }: UpdateArtifactParams): Promise<void> => {
  const updatedArtifact: Artifact = {
    ...artifact,
    ...artifactProps
  };

  return axios.put(`${process.env.REACT_APP_API_URL}/artifacts`, updatedArtifact).then(() => undefined);
};

export default updateArtifact;
