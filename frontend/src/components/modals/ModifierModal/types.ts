/**
 * Types for ModifierModal components
 */

export interface Operand {
  id: string;
  preLabel?: string;
  postLabel?: string;
  type?: 'editor' | 'selector' | 'label';
  typeSpecifier?: {
    type?: string;
    editorType?: string;
    displayField?: string;
    requiredFields?: string[];
    [key: string]: unknown;
  };
  selectionValues?: Array<{ value: string; label: string }>;
  selectionRequiresPredefinedCodes?: boolean;
  value?: string;
  name?: string;
  [key: string]: unknown;
}

export interface Operator {
  id: string;
  name?: string;
  displayName?: string;
  userSelectedOperands?: Operand[];
  [key: string]: unknown;
}

export interface Rule {
  id: string;
  conjunctionType?: 'and' | 'or';
  rules?: Rule[];
  resourceProperty?: string;
  operator?: Operator;
  conceptValue?: { system: string; code: string; display?: string };
  conceptValues?: Array<{ system: string; code: string; display?: string }>;
  valueset?: { name: string };
  codeValue?: Array<string | { inputValue?: string }>;
  [key: string]: unknown;
}

export interface ModifierTree {
  inputTypes?: string[];
  returnType?: string;
  type?: string;
  id?: string;
  name?: string;
  values?: Record<string, unknown>;
  validator?: {
    type: string;
    fields: string[];
    args?: string[];
  };
  // where is required and must be the tree structure (not boolean)
  where: {
    id: string;
    conjunctionType: 'and' | 'or';
    rules: Rule[];
  };
  [key: string]: unknown;
}

export interface ResourceOption {
  label: string;
  value: string;
  typeSpecifier?: {
    type?: string;
    editorType?: string;
    [key: string]: unknown;
  };
  predefinedCodes?: string[];
  allowsCustomCodes?: boolean;
  isSubheader?: boolean;
  labelPrefix?: string;
  [key: string]: unknown;
}
