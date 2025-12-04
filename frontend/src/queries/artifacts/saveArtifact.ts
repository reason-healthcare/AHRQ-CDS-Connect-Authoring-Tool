import axios from 'axios';
import _ from 'lodash';
import type { Artifact } from '../../types/artifact';

interface SaveArtifactParams {
  artifact: Artifact;
  artifactProps?: Partial<Artifact>;
}

const saveArtifact = async ({ artifact, artifactProps }: SaveArtifactParams): Promise<Artifact> => {
  const updatedArtifact: Artifact = {
    ...artifact,
    ...artifactProps
  };

  if (updatedArtifact._id == null) {
    const artifactWithoutId = _.omit(updatedArtifact, ['_id']);
    return axios
      .post<Artifact>(`${process.env.REACT_APP_API_URL}/artifacts`, artifactWithoutId)
      .then(result => result.data);
  }

  return axios.put<Artifact>(`${process.env.REACT_APP_API_URL}/artifacts`, updatedArtifact).then(() => updatedArtifact);
};

export default saveArtifact;
