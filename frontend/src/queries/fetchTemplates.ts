import axios from 'axios';
import type { Template } from '../types/query';

const fetchTemplates = async (): Promise<Template[]> => {
  const { data } = await axios.get<Template[]>(`${process.env.REACT_APP_API_URL}/config/templates`);

  return data;
};

export default fetchTemplates;
