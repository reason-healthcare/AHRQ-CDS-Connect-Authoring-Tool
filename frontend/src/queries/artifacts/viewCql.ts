import axios from 'axios';
import type { Artifact, DataModel } from '../../types/artifact';
import type { ViewCqlResponse } from '../../types/query';

interface ViewCqlParams {
  artifact: Artifact;
  dataModel: DataModel;
}

const viewCql = async ({ artifact, dataModel }: ViewCqlParams): Promise<ViewCqlResponse> => {
  const { data } = await axios.post<ViewCqlResponse>(`${process.env.REACT_APP_API_URL}/cql/viewCql`, {
    ...artifact,
    dataModel
  });

  return data;
};

export default viewCql;
