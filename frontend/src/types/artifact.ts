/**
 * Shared type definitions for Artifacts and related structures
 * Used across actions, reducers, queries, and utils
 */

// Import Instance type from utils
import type { Instance } from '../utils/instances';
import type { PatientBundle } from './patient';

export interface Field {
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

export interface ExpressionTree extends Instance {
  path?: string;
  conjunction?: boolean;
  childInstances?: ExpressionTree[];
}

export interface Subpopulation {
  uniqueId?: string;
  subpopulationName?: string;
  special?: boolean;
  special_subpopulationName?: string;
  childInstances?: Instance[];
  conjunction?: boolean;
  returnType?: string;
  path?: string;
  fields?: Field[];
  id?: string;
  name?: string;
}

export interface RecommendationLink {
  uid?: string;
  type?: string;
  label?: string;
  url?: string;
}

export interface RecommendationAction {
  type?: string;
  description?: string;
  resource?: Record<string, unknown>;
}

export interface RecommendationSuggestion {
  uid?: string;
  label?: string;
  actions?: RecommendationAction[];
}

export interface Recommendation {
  uid?: string;
  grade?: string;
  text?: string;
  rationale?: string;
  comment?: string;
  subpopulations?: Subpopulation[];
  links?: RecommendationLink[];
  suggestions?: RecommendationSuggestion[];
}

export interface Parameter {
  uniqueId?: string;
  name?: string;
  type?: string;
  comment?: string;
  usedBy?: string[];
  value?: string | number | Record<string, unknown> | null;
}

export interface BaseElement extends Instance {
  usedBy?: string[];
}

export interface BaseElementList extends Instance {
  id: string;
  childInstances: Instance[];
  needToPromote?: boolean;
}

export interface ErrorStatementIfThenClause {
  ifCondition?: {
    label?: string | null;
    value?: string | null;
    uniqueId?: string;
  };
  statements?: Instance[];
  thenClause?: string;
  useThenClause?: boolean;
  child?: Record<string, unknown>;
}

export interface ErrorStatement {
  id?: string;
  ifThenClauses?: ErrorStatementIfThenClause[];
  elseClause?: string;
}

export interface DataModel {
  version: string;
  [key: string]: unknown;
}

export interface Artifact {
  _id?: string | null;
  name?: string;
  version?: string;
  fhirVersion?: string;
  expTreeInclude?: ExpressionTree;
  expTreeExclude?: ExpressionTree;
  recommendations?: Recommendation[];
  subpopulations?: Subpopulation[];
  baseElements?: BaseElement[];
  parameters?: Parameter[];
  errorStatement?: ErrorStatement;
  dataModel?: DataModel;
  user?: string;
  path?: string;
  patients?: PatientBundle[];
  updatedAt?: string;
  createdAt?: string;
}

export interface LibraryInUse {
  name: string;
  version?: string;
  [key: string]: unknown;
}
