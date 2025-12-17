/**
 * Type conversion utilities for Modifier and ModifierTree
 *
 * Modifier is the stored format (where where?: boolean indicates user-defined modifier)
 * ModifierTree is the UI editing format (where where is a rule tree object)
 */

import type { Modifier } from './instances';
import type { ModifierTree } from '../components/modals/ModifierModal/types';

/**
 * Converts a ModifierTree to a Modifier for storage
 * ModifierTree has where as a rule tree object
 * Modifier allows where to be either boolean or ModifierTree['where'] object
 * For user-defined modifiers, preserve the where object structure
 * For regular modifiers, preserve all properties as-is
 */
export function modifierTreeToModifier(tree: ModifierTree): Modifier {
  // Check if this is a user-defined modifier (has where as an object)
  const isUserDefined = tree.where && typeof tree.where === 'object' && 'id' in tree.where;

  if (isUserDefined) {
    // User-defined modifier: preserve where as object (Modifier type allows this)
    const modifier: Modifier = {
      where: tree.where
    };

    if (tree.id !== undefined) modifier.id = tree.id;
    if (tree.type !== undefined) modifier.type = tree.type;
    if (tree.returnType !== undefined) modifier.returnType = tree.returnType;
    if (tree.values !== undefined) modifier.values = tree.values;
    if (tree.validator !== undefined) modifier.validator = tree.validator;
    // Preserve name property if present
    if ((tree as { name?: string }).name !== undefined) {
      (modifier as { name?: string }).name = (tree as { name?: string }).name;
    }
    // Preserve inputTypes if present (needed for regular modifiers)
    if ((tree as { inputTypes?: unknown[] }).inputTypes !== undefined) {
      (modifier as { inputTypes?: unknown[] }).inputTypes = (tree as { inputTypes?: unknown[] }).inputTypes;
    }

    return modifier;
  } else {
    // Regular modifier: preserve all properties as-is
    // This handles modifiers selected from dropdown that don't have where property
    return tree as Modifier;
  }
}

/**
 * Converts a Modifier to a ModifierTree for UI editing
 * Only works for user-defined modifiers (where where === true)
 */
export function modifierToModifierTree(modifier: Modifier): ModifierTree | null {
  // Only convert if it's a user-defined modifier (where === true)
  if (modifier.where !== true) {
    return null;
  }

  // For existing user-defined modifiers, we need to reconstruct the tree
  // This is a simplified conversion - in practice, the tree structure should be stored
  const tree: ModifierTree = {
    // Create a default empty tree structure
    where: {
      id: 'root',
      conjunctionType: 'and',
      rules: []
    }
  };

  if (modifier.id !== undefined) tree.id = modifier.id;
  tree.type = modifier.type || 'UserDefinedModifier';
  if (modifier.returnType !== undefined) tree.returnType = modifier.returnType;
  if (modifier.values !== undefined) tree.values = modifier.values;
  if (modifier.validator !== undefined) tree.validator = modifier.validator;
  // Preserve name property if present
  if ((modifier as { name?: string }).name !== undefined) {
    (tree as { name?: string }).name = (modifier as { name?: string }).name;
  }

  return tree;
}

/**
 * Converts an array of ModifierTrees to Modifiers
 */
export function modifierTreesToModifiers(trees: ModifierTree[]): Modifier[] {
  return trees.map(modifierTreeToModifier);
}

/**
 * Converts an array of Modifiers to ModifierTrees (filters out non-user-defined)
 */
export function modifiersToModifierTrees(modifiers: Modifier[]): ModifierTree[] {
  return modifiers.map(modifierToModifierTree).filter((tree): tree is ModifierTree => tree !== null);
}
