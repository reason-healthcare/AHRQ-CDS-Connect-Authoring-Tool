import axios from 'axios';
import FileSaver from 'file-saver';
import { validateArtifact } from 'queries/testing';
import { changeToCase } from 'utils/strings';
import type { Artifact, DataModel } from '../../types/artifact';
import type { ValidateArtifactResponse } from '../../types/query';

interface DownloadArtifactParams {
  artifact: Artifact;
  dataModel: DataModel;
}

const downloadArtifact = async ({ artifact, dataModel }: DownloadArtifactParams): Promise<ValidateArtifactResponse> => {
  const artifactWithDataModel: Artifact = {
    ...artifact,
    dataModel
  };
  const fileName = changeToCase(`${artifact.name}-v${artifact.version}-cql`, 'snakeCase');
  return axios
    .post(`${process.env.REACT_APP_API_URL}/cql`, artifactWithDataModel, { responseType: 'blob' })
    .then(result => {
      FileSaver.saveAs(result.data, `${fileName}.zip`);
      return result.data;
    })
    .then(async () => {
      return validateArtifact({ artifact, dataModel });
    });
};

export default downloadArtifact;
