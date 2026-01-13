import Validators from './validators';
import _ from 'lodash';
import { getOriginalBaseElement } from 'utils/baseElements';
import { isElementAndOr } from './lists';

// Import ModifierTree type for compatibility
import type { ModifierTree } from '../components/modals/ModifierModal/types';

export interface Modifier {
  validator?: {
    type: string;
    fields: string[];
    args?: string[];
  };
  values?: Record<string, unknown>;
  // where can be boolean (stored format) or ModifierTree['where'] (UI editing format)
  where?: boolean | ModifierTree['where'];
  returnType?: string;
  id?: string;
  type?: string;
  name?: string;
  argumentTypes?: string[];
  arguments?: Record<string, unknown>;
}

export interface Instance {
  returnType?: string;
  modifiers?: Modifier[];
  fields?: Array<{ type?: string; id?: string; value?: unknown; [key: string]: unknown }>;
  childInstances?: Instance[];
  uniqueId?: string;
  name?: string;
  checkInclusionInVS?: boolean;
  suppressedModifiers?: string[];
  type?: string;
  usedBy?: string[];
  conjunction?: boolean;
  [key: string]: unknown;
  validator?: {
    type: string;
    fields: string[];
    args?: string[];
  };
  id?: string;
  cannotHaveModifiers?: boolean;
  path?: string;
  template?: string;
  subpopulationName?: string;
  tab?: string;
}

interface ElementTemplateGroup {
  entries: Array<{ id?: string; suppress?: boolean }>;
}

export function validateModifier(modifier: Modifier | null | undefined): string | null {
  let validationWarning: string | null = null;

  if (modifier && modifier.validator) {
    const validator = Validators[modifier.validator.type as keyof typeof Validators];
    const values = modifier.validator.fields.map(v => modifier.values && modifier.values[v]);
    const args = modifier.validator.args ? modifier.validator.args.map(v => modifier.values?.[v]) : [];
    if (!validator.check(values, args)) {
      validationWarning = validator.warning(modifier.validator.fields, args);
    }
  }
  return validationWarning;
}

// Gets the returnType of the last valid modifier
export function getReturnType(startingReturnType: string, modifiers: Modifier[] = []): string {
  let returnType = startingReturnType;
  if (modifiers.length === 0) return returnType || '';

  for (let index = modifiers.length - 1; index >= 0; index--) {
    const modifier = modifiers[index];
    // Check to see if the modifier is a user-built one.
    // where can be boolean (true) or an object (ModifierTree['where'])
    if (modifier.where === true || (modifier.where && typeof modifier.where === 'object')) {
      returnType = modifier.returnType || returnType;
    } else if (validateModifier(modifier) === null) {
      returnType = modifier.returnType || returnType;
      break;
    }
  }

  return returnType || '';
}

function getAllChildInstances(childInstances: Instance[] | null | undefined): Instance[] {
  return _.flatten(
    (childInstances || []).map(instance => {
      if (instance.childInstances) {
        return _.flatten([instance, getAllChildInstances(instance.childInstances)]);
      }
      return instance;
    })
  );
}

// Determines if the return type is valid for the given group type
export function isReturnTypeValid(
  returnType: string,
  id: string,
  childInstances: Instance[] | null | undefined
): boolean {
  if (isElementAndOr(id)) {
    return returnType.toLowerCase() === 'boolean' || getAllChildInstances(childInstances).length === 1;
  }
  return true;
}

export function allModifiersValid(modifiers: Modifier[] | null | undefined): boolean {
  if (!modifiers) return true;

  let areAllModifiersValid = true;
  modifiers.forEach(modifier => {
    if (validateModifier(modifier) !== null) areAllModifiersValid = false;
  });
  return areAllModifiersValid;
}

export function filterRelevantModifiers(modifiers: Modifier[] | null | undefined, instance: Instance): Modifier[] {
  const relevantModifiers = (modifiers || []).slice();
  if (!instance.checkInclusionInVS) {
    // Rather than suppressing `CheckInclusionInVS` in every element, assume it's suppressed unless explicity
    // stated otherwise
    _.remove(relevantModifiers, modifier => modifier.id === 'CheckInclusionInVS');
  }
  if (_.has(instance, 'suppressedModifiers')) {
    instance.suppressedModifiers?.forEach(suppressedModifier =>
      _.remove(relevantModifiers, relevantModifier => relevantModifier.id === suppressedModifier)
    );
  }
  return relevantModifiers;
}

export function getFieldWithType(
  fields: Array<{ type?: string; id?: string }> | null | undefined,
  type: string
): { type?: string; id?: string } | undefined {
  return fields?.find(f => f.type && f.type.endsWith(type));
}

export function getFieldWithId(
  fields: Array<{ id?: string }> | null | undefined,
  id: string
): { id?: string } | undefined {
  return fields?.find(f => f.id === id);
}

export function getElementTemplate(
  elementTemplateGroups: ElementTemplateGroup[],
  templateId: string
): Array<{ id?: string; suppress?: boolean }> {
  let elementTemplate: Array<{ id?: string; suppress?: boolean }> | undefined;
  elementTemplateGroups.find(templateGroup => {
    const found = templateGroup.entries.find(template => template.id === templateId);
    if (found) {
      elementTemplate = templateGroup.entries;
    }
    return found !== undefined;
  });

  return _.cloneDeep(elementTemplate).filter(template => !template.suppress);
}

export function getInstanceByReference(
  allInstances: Instance[],
  referenceField: { type?: string; id?: string }
): Instance | undefined {
  return allInstances.find(instance => Boolean(instance.fields?.find(field => _.isEqual(field, referenceField))));
}

export function getInstanceById(allInstances: Instance[], instanceId: string): Instance | undefined {
  return allInstances.find(instance => instance.uniqueId === instanceId);
}

export function getLabelForInstance(
  instance: Instance,
  baseElements: Array<{ uniqueId?: string; type?: string; name?: string }>
): string {
  let label = instance.name || '';
  const referenceField = getFieldWithType(instance.fields, 'reference');
  if (referenceField && referenceField.id === 'baseElementReference') {
    // Element type to display in header will be the reference type for Base Elements.
    const originalBaseElement = getOriginalBaseElement(instance, baseElements) as { type?: string; name?: string };
    label = originalBaseElement.type === 'parameter' ? 'Parameter' : originalBaseElement.name || '';
  }
  return label;
}

export function getReferenceArguments(
  referenceFieldArgs: Array<{
    value?: { argSource?: string; selected?: string; elementName?: string; [key: string]: unknown };
  }>
): Array<{ value?: { argSource?: string; selected?: string; elementName?: string; [key: string]: unknown } }> {
  const referenceSetIds = new Set<string>();
  referenceFieldArgs.forEach(arg => {
    if (
      arg.value &&
      arg.value.argSource &&
      arg.value.argSource !== 'editor' &&
      arg.value.argSource !== '' &&
      arg.value.argSource !== 'externalCql' &&
      arg.value.selected
    ) {
      referenceSetIds.add(arg.value.selected);
    }
  });

  return [...referenceSetIds]
    .map(referenceSetId => referenceFieldArgs.find(arg => arg.value?.selected === referenceSetId))
    .filter(
      (
        arg
      ): arg is { value?: { argSource?: string; selected?: string; elementName?: string; [key: string]: unknown } } =>
        arg !== undefined
    );
}
