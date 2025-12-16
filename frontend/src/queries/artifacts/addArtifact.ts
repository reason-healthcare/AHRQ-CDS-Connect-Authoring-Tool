import axios from 'axios';
import _ from 'lodash';

import createTemplateInstance from 'utils/templates';
import { getFieldWithId } from 'utils/instances';
import { generateErrorStatement } from 'components/builder/error-statement/utils';
import type { Artifact, ExpressionTree } from '../../types/artifact';

interface Template {
  name?: string;
  entries?: Array<{ name?: string }>;
}

function initializeTrees(
  andTemplate: { id?: string; conjunction?: boolean },
  orTemplate: { id?: string; conjunction?: boolean }
) {
  const newExpTreeInclude = createTemplateInstance(andTemplate);
  (newExpTreeInclude as { path?: string }).path = '';
  const newExpTreeIncludeNameField = getFieldWithId(
    (newExpTreeInclude as { fields?: Array<{ id?: string }> }).fields,
    'element_name'
  );
  if (newExpTreeIncludeNameField) {
    (newExpTreeIncludeNameField as { value?: string }).value = 'MeetsInclusionCriteria';
  }

  const newExpTreeExclude = createTemplateInstance(orTemplate);
  (newExpTreeExclude as { path?: string }).path = '';
  const newExpTreeExcludeNameField = getFieldWithId(
    (newExpTreeExclude as { fields?: Array<{ id?: string }> }).fields,
    'element_name'
  );
  if (newExpTreeExcludeNameField) {
    (newExpTreeExcludeNameField as { value?: string }).value = 'MeetsExclusionCriteria';
  }

  return {
    newExpTreeInclude,
    newExpTreeExclude
  };
}

function initialArtifact(templates: Template[]): Artifact {
  const operations = templates.find(template => template.name === 'Operations');
  const andTemplate = operations?.entries?.find(entry => entry.name === 'And');
  const orTemplate = operations?.entries?.find(entry => entry.name === 'Or');
  if (!andTemplate || !orTemplate) {
    throw new Error('Could not find And/Or templates');
  }
  const newTrees = initializeTrees(
    andTemplate as { id?: string; conjunction?: boolean },
    orTemplate as { id?: string; conjunction?: boolean }
  );

  return {
    _id: null,
    name: 'Untitled Artifact',
    version: '1',
    fhirVersion: '',
    expTreeInclude: newTrees.newExpTreeInclude as ExpressionTree,
    expTreeExclude: newTrees.newExpTreeExclude as ExpressionTree,
    recommendations: [],
    subpopulations: [
      {
        special: true,
        subpopulationName: "Doesn't Meet Inclusion Criteria",
        special_subpopulationName: 'not "MeetsInclusionCriteria"',
        uniqueId: 'default-subpopulation-1'
      },
      {
        special: true,
        subpopulationName: 'Meets Exclusion Criteria',
        special_subpopulationName: '"MeetsExclusionCriteria"',
        uniqueId: 'default-subpopulation-2'
      }
    ],
    baseElements: [],
    parameters: [],
    errorStatement: generateErrorStatement('root')
  };
}

interface AddArtifactParams {
  artifactProps?: Partial<Artifact>;
}

// Same as addArtifact but does not save to database when initializing
export async function initializeArtifact(): Promise<Artifact> {
  const { data } = await axios.get<Template[]>(`${process.env.REACT_APP_API_URL}/config/templates`);
  const artifact: Artifact = {
    ...initialArtifact(data)
  };
  return artifact;
}

const addArtifact = async ({ artifactProps }: AddArtifactParams): Promise<Artifact> => {
  const { data } = await axios.get<Template[]>(`${process.env.REACT_APP_API_URL}/config/templates`);
  const artifact: Artifact = {
    ...initialArtifact(data),
    ...artifactProps
  };

  const artifactWithoutId = _.omit(artifact, ['_id']);
  return axios
    .post<Artifact>(`${process.env.REACT_APP_API_URL}/artifacts`, artifactWithoutId)
    .then(result => result.data);
};

export default addArtifact;
