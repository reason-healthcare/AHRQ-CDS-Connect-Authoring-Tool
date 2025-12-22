import { cloneDeep } from 'lodash';
import type { Artifact } from '../../../types/artifact';
import type { ExpressionTree } from '../../../types/artifact';

export const getTree = (
  artifact: Artifact,
  treeName: 'expTreeInclude' | 'expTreeExclude',
  uid: string | null = null
): { tree?: ExpressionTree; array?: ExpressionTree[]; index?: number } => {
  const tree = cloneDeep(artifact[treeName]) as ExpressionTree;
  if (uid == null) {
    return { tree };
  }
  const array = artifact[treeName]?.childInstances as ExpressionTree[];
  const index = array.findIndex(e => e.uniqueId === uid);
  return { array, tree: array[index], index };
};
