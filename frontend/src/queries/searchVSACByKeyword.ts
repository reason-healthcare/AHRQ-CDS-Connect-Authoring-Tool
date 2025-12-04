import axios from 'axios';

interface SearchVSACByKeywordParams {
  keyword: string;
  apiKey: string;
}

interface VSACSearchResult {
  codeCount: number;
  name?: string;
  oid?: string;
  [key: string]: unknown;
}

interface VSACSearchResponse {
  count: number;
  total: number;
  results: VSACSearchResult[];
}

const searchVSACByKeyword = async ({ keyword, apiKey }: SearchVSACByKeywordParams): Promise<VSACSearchResponse> => {
  const { data } = await axios.get<VSACSearchResponse>(
    `${process.env.REACT_APP_API_URL}/fhir/search?keyword=${keyword}`,
    {
      auth: { username: '', password: apiKey }
    }
  );

  return {
    count: data.count,
    total: data.total,
    results: data.results.sort((a, b) => b.codeCount - a.codeCount)
  };
};

export default searchVSACByKeyword;
