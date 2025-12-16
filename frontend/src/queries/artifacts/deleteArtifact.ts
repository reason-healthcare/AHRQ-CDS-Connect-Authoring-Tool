import axios from 'axios';

interface DeleteArtifactParams {
  artifact: { _id: string };
}

const deleteArtifact = async ({ artifact }: DeleteArtifactParams): Promise<void> => {
  await axios.delete(`${process.env.REACT_APP_API_URL}/artifacts/${artifact._id}`);
};

export default deleteArtifact;
