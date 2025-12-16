import axios from 'axios';

interface FetchUnitsOfMeasureParams {
  terms: string;
}

interface UnitOfMeasure {
  value: string;
  label: string;
}

const fetchUnitsOfMeasure = async ({ terms }: FetchUnitsOfMeasureParams): Promise<UnitOfMeasure[]> => {
  const { data } = await axios.get<unknown[]>(`https://clin-table-search.lhc.nlm.nih.gov/api/ucum/v3/search`, {
    params: { terms }
  });

  if (!data[3]) return [];

  return (data[3] as Array<[string, string]>).map(([code, desc]) => ({
    value: code,
    label: `${code} (${desc})`
  }));
};

export default fetchUnitsOfMeasure;
