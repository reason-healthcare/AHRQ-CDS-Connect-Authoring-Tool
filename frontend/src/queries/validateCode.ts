import axios from 'axios';

interface ValidateCodeParams {
  code: string;
  system: string;
  apiKey: string;
}

interface ValidateCodeResponse {
  valid?: boolean;
  display?: string;
  [key: string]: unknown;
}

const validateCode = async ({ code, system, apiKey }: ValidateCodeParams): Promise<ValidateCodeResponse> => {
  const { data } = await axios.get<ValidateCodeResponse>(`${process.env.REACT_APP_API_URL}/fhir/code`, {
    auth: { username: '', password: apiKey },
    params: { code, system }
  });

  return data;
};

export default validateCode;
