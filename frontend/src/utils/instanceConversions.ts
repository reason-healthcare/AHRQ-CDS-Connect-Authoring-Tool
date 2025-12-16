/**
 * Type conversion utilities for Instance and TemplateInstance
 *
 * Instance has optional fields, TemplateInstance has required fields
 */

import type { Instance } from './instances';

// TemplateInstance from test_fixtures.ts
interface Field {
  id: string;
  type?: string;
  name?: string;
  value?: string | number | { id?: string; name?: string; value?: string; type?: string } | null;
  typeOfNumber?: string;
  select?: string;
  static?: boolean;
  suppress?: boolean;
  valueSets?: Array<{ name: string; oid: string }>;
  codes?: Array<{ code: string; codeSystem: { name: string; id?: string } }>;
}

export interface TemplateInstance {
  returnType?: string;
  modifiers?: Array<{ id?: string; type?: string; [key: string]: unknown }>;
  fields: Field[]; // Required, not optional like in Instance
  childInstances?: TemplateInstance[];
  uniqueId?: string;
  name?: string;
  checkInclusionInVS?: boolean;
  suppressedModifiers?: string[];
  type?: string;
  usedBy?: string[];
  conjunction?: boolean;
  validator?: {
    type: string;
    fields: string[];
    args?: string[];
  };
  id?: string;
  cannotHaveModifiers?: boolean;
  path?: string;
  extends?: string;
  template?: string;
  suppress?: boolean;
}

/**
 * Converts a TemplateInstance to an Instance
 * TemplateInstance has required fields, Instance has optional fields
 */
export function templateInstanceToInstance(template: unknown): Instance {
  // Type guard to ensure template has the expected structure
  if (!template || typeof template !== 'object') {
    return { fields: [] };
  }

  const templateObj = template as Record<string, unknown>;
  // Ensure fields is an array
  const fields = Array.isArray(templateObj.fields) ? templateObj.fields : [];
  const childInstances = Array.isArray(templateObj.childInstances) ? templateObj.childInstances : undefined;

  return {
    ...templateObj,
    fields: fields.map((field: unknown) => {
      if (!field || typeof field !== 'object') {
        return { id: '' };
      }
      const fieldObj = field as Record<string, unknown>;
      return {
        id: typeof fieldObj.id === 'string' ? fieldObj.id : '',
        type: typeof fieldObj.type === 'string' ? fieldObj.type : undefined,
        value: fieldObj.value,
        ...fieldObj
      };
    }),
    childInstances: childInstances?.map(templateInstanceToInstance)
  } as Instance;
}

/**
 * Converts an Instance to a TemplateInstance
 * Requires that fields exists and is an array
 */
export function instanceToTemplateInstance(instance: Instance): TemplateInstance | null {
  if (!instance.fields || !Array.isArray(instance.fields)) {
    return null;
  }

  // Type guard to ensure fields match Field[] structure
  const fields: Field[] = instance.fields.map(field => {
    if (!field.id) {
      throw new Error('Field must have an id property');
    }
    return {
      id: field.id,
      type: field.type,
      name: field.name as string | undefined,
      value: field.value,
      typeOfNumber: field.typeOfNumber as string | undefined,
      select: field.select as string | undefined,
      static: field.static as boolean | undefined,
      suppress: field.suppress as boolean | undefined,
      valueSets: field.valueSets as Array<{ name: string; oid: string }> | undefined,
      codes: field.codes as Array<{ code: string; codeSystem: { name: string; id?: string } }> | undefined
    };
  });

  const result: TemplateInstance = {
    returnType: instance.returnType,
    modifiers: instance.modifiers?.map(mod => ({
      id: mod.id,
      type: mod.type,
      ...mod
    })),
    fields,
    childInstances: instance.childInstances?.map(inst => {
      const converted = instanceToTemplateInstance(inst);
      if (!converted) {
        throw new Error('Cannot convert child instance: missing required fields');
      }
      return converted;
    }),
    uniqueId: instance.uniqueId,
    name: instance.name,
    checkInclusionInVS: instance.checkInclusionInVS,
    suppressedModifiers: instance.suppressedModifiers,
    type: instance.type,
    usedBy: instance.usedBy,
    conjunction: instance.conjunction,
    validator: instance.validator,
    id: instance.id,
    cannotHaveModifiers: instance.cannotHaveModifiers,
    path: instance.path,
    template: instance.template,
    suppress: instance.suppress as boolean | undefined
  };

  return result;
}
