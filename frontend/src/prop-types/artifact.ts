/**
 * Legacy PropTypes converted to TypeScript interfaces
 * These types are provided for backward compatibility
 * Consider using types from '../types/artifact' for new code
 */

export interface FieldsProps {
  id?: string;
  name?: string;
  type?: string;
  value?: unknown[] | string | number | Record<string, unknown>;
}

export interface ParametersProps {
  comment?: string;
  name?: string;
  type?: string;
  uniqueId?: string;
  usedBy?: unknown[];
  value?: unknown[] | string | number | Record<string, unknown>;
}

export interface ExpTreeProps {
  id?: string;
  name?: string;
  conjunction?: boolean;
  path?: string;
  returnType?: string;
  fields?: FieldsProps[];
  childInstances?: Array<{
    id?: string;
    name?: string;
    returnType?: string;
    fields?: FieldsProps[];
  }>;
}

export interface SubpopulationsProps extends ExpTreeProps {
  uniqueId?: string;
  subpopulationName?: string;
  special?: boolean;
  special_subpopulationName?: string;
}

export interface ErrorStatementCondition {
  label?: string;
  value?: string;
}

export interface ErrorStatementStatement {
  child?: Record<string, unknown>;
  thenClause?: string;
  useThenClause?: boolean;
  condition?: ErrorStatementCondition;
}

export interface ErrorStatementProps {
  else?: string;
  statements?: ErrorStatementStatement[];
}

export interface RecommendationProps {
  uid?: string;
  grade?: string;
  rationale?: string;
  text?: string;
  comment?: string;
  subpopulations?: SubpopulationsProps[];
}

export interface ArtifactProps {
  id?: string;
  user?: string;
  name?: string;
  version?: string;
  path?: string;
  expTreeInclude?: ExpTreeProps;
  expTreeExclude?: ExpTreeProps;
  recommendations?: RecommendationProps[];
  subpopulations?: SubpopulationsProps[];
  parameters?: ParametersProps[];
  errorStatement?: ErrorStatementProps;
  patients?: Array<Record<string, unknown>>;
}

export default ArtifactProps;
