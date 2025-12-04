import axios from 'axios';
import type { Artifact, DataModel } from '../../types/artifact';
import type { ValidateArtifactResponse } from '../../types/query';

interface ValidateArtifactParams {
  artifact: Artifact;
  dataModel: DataModel;
}

const validateArtifact = async ({ artifact, dataModel }: ValidateArtifactParams): Promise<ValidateArtifactResponse> => {
  const { data } = await axios.post<ValidateArtifactResponse>(
    `${process.env.REACT_APP_API_URL}/cql/validate?includeCQL=true`,
    {
      ...artifact,
      dataModel
    }
  );

  return data;
};

export default validateArtifact;
