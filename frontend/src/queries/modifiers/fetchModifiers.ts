import axios from 'axios';
import _ from 'lodash';

interface Modifier {
  id: string;
  inputTypes: string[];
}

interface FetchModifiersParams {
  artifactId: string;
}

interface FetchModifiersResult {
  modifierMap: Record<string, Modifier>;
  modifiersByInputType: Record<string, Modifier[]>;
}

const fetchModifiers = async ({ artifactId }: FetchModifiersParams): Promise<FetchModifiersResult> => {
  const { data: modifiers } = await axios.get<Modifier[]>(`${process.env.REACT_APP_API_URL}/modifiers/${artifactId}`);
  const modifierMap = _.keyBy(modifiers, 'id');
  const modifiersByInputType: Record<string, Modifier[]> = {};

  modifiers.forEach(modifier => {
    modifier.inputTypes.forEach(inputType => {
      modifiersByInputType[inputType] = (modifiersByInputType[inputType] || []).concat(modifier);
    });
  });

  return { modifierMap, modifiersByInputType };
};

export default fetchModifiers;
