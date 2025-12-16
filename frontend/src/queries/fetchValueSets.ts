import axios from 'axios';

interface ValueSetExpansion {
  contains?: Array<{
    code?: string;
    display?: string;
    system?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface FetchValueSetsParams {
  type: string;
}

const fetchValueSets = async ({ type }: FetchValueSetsParams): Promise<ValueSetExpansion> => {
  const { data } = await axios.get<{ expansion: ValueSetExpansion }>(
    `${process.env.REACT_APP_API_URL}/config/valuesets/${type}`
  );

  return data.expansion;
};

export default fetchValueSets;
