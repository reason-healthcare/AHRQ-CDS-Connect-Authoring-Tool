import axios from 'axios';

interface DeleteExternalCqlParams {
  library: { _id: string };
}

const deleteExternalCql = async ({ library }: DeleteExternalCqlParams): Promise<void> => {
  await axios.delete(`${process.env.REACT_APP_API_URL}/externalCQL/${library._id}`);
};

export default deleteExternalCql;
