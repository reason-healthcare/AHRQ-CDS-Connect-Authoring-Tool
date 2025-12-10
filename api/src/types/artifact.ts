/**
 * Shared type definitions for Artifact structures
 * Used across handlers, models, and utilities
 */

// Field structure used in elements
export interface ArtifactField {
  id: string;
  type?: string;
  value?: string | number | boolean | { id?: string; name?: string; value?: string | number; type?: string } | null;
  [key: string]:
    | string
    | number
    | boolean
    | { id?: string; name?: string; value?: string | number; type?: string }
    | null
    | undefined;
}

// Modifier structure
export interface ArtifactModifier {
  id?: string;
  type?: string;
  values?: Record<string, string | number | boolean | null | undefined>;
  where?: Record<string, unknown>;
  [key: string]:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | Record<string, string | number | boolean | null | undefined>
    | undefined;
}

// Element/Instance structure
export interface ArtifactElement {
  id?: string;
  type?: string;
  template?: string;
  extends?: string;
  uniqueId?: string;
  name?: string;
  fields?: ArtifactField[];
  modifiers?: ArtifactModifier[];
  childInstances?: ArtifactElement[];
  conjunction?: boolean;
  returnType?: string;
  [key: string]: string | number | boolean | ArtifactField[] | ArtifactModifier[] | ArtifactElement[] | undefined;
}

// Parameter structure
export interface ArtifactParameter {
  uniqueId?: string;
  name?: string;
  type?: string;
  value?:
    | string
    | number
    | { system?: string; uri?: string; code?: string; unit?: string; [key: string]: string | number | undefined };
  comment?: string | string[];
  [key: string]:
    | string
    | number
    | string[]
    | { system?: string; uri?: string; code?: string; unit?: string; [key: string]: string | number | undefined }
    | undefined;
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
  [key: string]: string | number | boolean | ArtifactElement[] | undefined;
}

// Recommendation structure
export interface ArtifactRecommendation {
  uid?: string;
  grade?: string;
  text?: string;
  rationale?: string;
  comment?: string;
  subpopulations?: ArtifactSubpopulation[];
  [key: string]: string | ArtifactSubpopulation[] | undefined;
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
    [key: string]:
      | string
      | boolean
      | ArtifactElement[]
      | { label?: string | null; value?: string | null; uniqueId?: string }
      | ArtifactErrorStatement
      | null
      | undefined;
  }>;
  elseClause?: string;
  [key: string]:
    | string
    | Array<{
        ifCondition?: { label?: string | null; value?: string | null; uniqueId?: string };
        statements?: ArtifactElement[];
        thenClause?: string;
        useThenClause?: boolean;
        child?: ArtifactErrorStatement;
        [key: string]:
          | string
          | boolean
          | ArtifactElement[]
          | { label?: string | null; value?: string | null; uniqueId?: string }
          | ArtifactErrorStatement
          | null
          | undefined;
      }>
    | undefined;
}

// Contact structure (author, reviewer, endorser)
export interface ArtifactContact {
  name?: string;
  [key: string]: string | undefined;
}

// Context structure
export interface ArtifactContext {
  code?: { system?: string; code?: string; display?: string };
  valueCodeableConcept?: { coding?: Array<{ system?: string; code?: string; display?: string }> };
  [key: string]:
    | string
    | { system?: string; code?: string; display?: string }
    | Array<{ system?: string; code?: string; display?: string }>
    | undefined;
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

// Full artifact structure (for internal use, not the Mongoose model)
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
  approvalDate?: Date;
  lastReviewDate?: Date;
  effectivePeriod?: {
    start?: Date;
    end?: Date;
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
  createdAt?: Date;
  updatedAt?: Date;
}
