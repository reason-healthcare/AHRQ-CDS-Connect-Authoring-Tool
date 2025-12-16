import { getReturnType } from 'utils/instances';
import type { Modifier } from '../../../utils/instances';
import type { ModifierTree } from '../../modals/ModifierModal/types';

interface ModifierRemovalResult {
  canBeRemoved: boolean;
  tooltipText?: string;
}

export const modifierCanBeRemoved = (
  baseElementIsUsed: boolean,
  index: number,
  returnType: string | undefined,
  modifiers: Modifier[]
): ModifierRemovalResult => {
  const hasMultipleModifiers = modifiers.length > 1;
  const nextModifier = modifiers[index + 1] as ModifierTree | undefined;
  const nextModifierAllowsReturnType = Boolean(nextModifier?.inputTypes?.includes(returnType || ''));
  const isFirstModifier = index === 0;
  const isLastModifier = index === modifiers.length - 1;
  const previousModifier = modifiers[index - 1] as ModifierTree | undefined;
  const nextModifierAllowsPreviousReturnType = Boolean(
    nextModifier?.inputTypes?.includes(previousModifier?.returnType || '')
  );
  const nextToLastModifierReturnTypeMatchesElement = Boolean(
    modifiers[modifiers.length - 2]?.returnType === getReturnType(returnType, modifiers)
  );
  const lastModifierReturnTypeMatchesElement = returnType === getReturnType(returnType, modifiers);

  let canBeRemoved = true;
  let tooltipText: string | undefined;
  if (hasMultipleModifiers) {
    if (isFirstModifier) {
      canBeRemoved = nextModifierAllowsReturnType;
      if (!canBeRemoved) tooltipText = 'Cannot remove modifier because return type does not match next input type.';
    } else if (isLastModifier) {
      canBeRemoved = baseElementIsUsed ? nextToLastModifierReturnTypeMatchesElement : true;
      if (!canBeRemoved) tooltipText = 'Cannot remove modifier because final return type would change while in use.';
    } else {
      canBeRemoved = nextModifierAllowsPreviousReturnType;
      if (!canBeRemoved) tooltipText = 'Cannot remove modifier because return type does not match next input type.';
    }
  } else if (baseElementIsUsed) {
    canBeRemoved = lastModifierReturnTypeMatchesElement;
    if (!canBeRemoved) tooltipText = 'Cannot remove modifier because final return type would change while in use.';
  }

  return { canBeRemoved, tooltipText };
};
