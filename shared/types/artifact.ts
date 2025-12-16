/**
 * Shared artifact type definitions for API contracts
 * These types define the contract between frontend and backend
 * Used for API request/response types
 */

// Core field structure (minimal shared definition)
export interface ArtifactField {
  id: string;
  type?: string;
  value?: string | number | boolean | { id?: string; name?: string; value?: string | number; type?: string } | null;
  [key: string]: unknown;
}

// Core modifier structure (minimal shared definition)
export interface ArtifactModifier {
  id?: string;
  type?: string;
  values?: Record<string, unknown>;
  where?: Record<string, unknown>;
  [key: string]: unknown;
}

// Core element structure (minimal shared definition)
export interface ArtifactElement {
  id?: string;
  type?: string;
  template?: string;
  uniqueId?: string;
  name?: string;
  fields?: ArtifactField[];
  modifiers?: ArtifactModifier[];
  childInstances?: ArtifactElement[];
  conjunction?: boolean;
  returnType?: string;
  [key: string]: unknown;
}

// Parameter structure
export interface ArtifactParameter {
  uniqueId?: string;
  name?: string;
  type?: string;
  value?: string | number | { system?: string; uri?: string; code?: string; unit?: string; [key: string]: unknown };
  comment?: string | string[];
  [key: string]: unknown;
}

// Subpopulation structure
export interface ArtifactSubpopulation {
  uniqueId?: string;
  subpopulationName?: string;
  special?: boolean;
  special_subpopulationName?: string;
  childInstances?: ArtifactElement[];
  conjunction?: boolean;
  returnType?: string;
  [key: string]: unknown;
}

// Recommendation structure
export interface ArtifactRecommendation {
  uid?: string;
  grade?: string;
  text?: string;
  rationale?: string;
  comment?: string;
  subpopulations?: ArtifactSubpopulation[];
  [key: string]: unknown;
}

// Error statement structure
export interface ArtifactErrorStatement {
  id?: string;
  ifThenClauses?: Array<{
    ifCondition?: { label?: string | null; value?: string | null; uniqueId?: string };
    statements?: ArtifactElement[];
    thenClause?: string;
    useThenClause?: boolean;
    child?: ArtifactErrorStatement;
    [key: string]: unknown;
  }>;
  elseClause?: string;
  [key: string]: unknown;
}

// Context structure
export interface ArtifactContext {
  code?: { system?: string; code?: string; display?: string };
  valueCodeableConcept?: { coding?: Array<{ system?: string; code?: string; display?: string }> };
  [key: string]: unknown;
}

// Contact structure
export interface ArtifactContact {
  name?: string;
  [key: string]: string | undefined;
}

// Related artifact structure
export interface ArtifactRelatedArtifact {
  type?: string;
  display?: string;
  url?: string;
  [key: string]: string | undefined;
}

// Data model structure
export interface ArtifactDataModel {
  version?: string;
  name?: string;
  url?: string;
  [key: string]: string | undefined;
}

// External library structure
export interface ArtifactExternalLibrary {
  name?: string;
  version?: string;
  path?: string;
  [key: string]: string | undefined;
}

// Expression tree (inclusions/exclusions)
export type ArtifactExpressionTree = ArtifactElement;

// Full artifact structure - API contract type
// This is the type used for API requests/responses
export interface ArtifactStructure {
  _id?: string;
  name?: string;
  version?: string;
  description?: string;
  url?: string;
  status?: string;
  experimental?: boolean;
  publisher?: string;
  context?: ArtifactContext[];
  purpose?: string;
  usage?: string;
  copyright?: string;
  approvalDate?: Date | string; // Accept both Date (backend) and string (frontend serialization)
  lastReviewDate?: Date | string;
  effectivePeriod?: {
    start?: Date | string;
    end?: Date | string;
  };
  topic?: Array<{ system: string; code: string; other?: string }>;
  author?: ArtifactContact[];
  reviewer?: ArtifactContact[];
  endorser?: ArtifactContact[];
  relatedArtifact?: ArtifactRelatedArtifact[];
  strengthOfRecommendation?: {
    strengthOfRecommendation?: string;
    system?: string;
    code?: string;
    other?: string;
  };
  qualityOfEvidence?: {
    qualityOfEvidence?: string;
    system?: string;
    code?: string;
    other?: string;
  };
  fhirVersion?: string;
  expTreeInclude?: ArtifactExpressionTree;
  expTreeExclude?: ArtifactExpressionTree;
  recommendations?: ArtifactRecommendation[];
  subpopulations?: ArtifactSubpopulation[];
  baseElements?: ArtifactElement[];
  parameters?: ArtifactParameter[];
  errorStatement?: ArtifactErrorStatement;
  externalLibs?: ArtifactExternalLibrary[];
  dataModel?: ArtifactDataModel;
  user?: string;
  createdAt?: Date | string; // Accept both Date (backend) and string (frontend serialization)
  updatedAt?: Date | string;
  // Frontend-specific properties (optional, may not be present in API responses)
  path?: string;
  patients?: unknown[]; // Patient bundles - frontend specific
}

