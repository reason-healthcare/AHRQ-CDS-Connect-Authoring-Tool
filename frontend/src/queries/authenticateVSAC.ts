import axios from 'axios';

interface AuthenticateVSACParams {
  apiKey: string;
}

interface AuthenticateVSACResponse {
  token?: string;
  [key: string]: unknown;
}

const authenticateVSAC = async ({ apiKey }: AuthenticateVSACParams): Promise<AuthenticateVSACResponse> => {
  const { data } = await axios.post<AuthenticateVSACResponse>(
    `${process.env.REACT_APP_API_URL}/fhir/login`,
    {},
    { auth: { username: '', password: apiKey } }
  );

  return data;
};

export default authenticateVSAC;
