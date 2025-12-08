import type { ModifierTree, Rule } from '../../types';

const allChildrenAreEmpty = (node: Rule): boolean => {
  // Rule is conjunction and has children
  if (node.conjunctionType) {
    return node.rules?.every(rule => allChildrenAreEmpty(rule)) ?? true;
  }
  // Rule is a leaf node
  else {
    return !(node.resourceProperty && node.operator && Boolean(node.operator.id));
  }
};

export const ruleTreeIsEmpty = (root: ModifierTree): boolean => {
  return allChildrenAreEmpty(root.where);
};
