/**
 * Shared type definitions for API query responses
 */

export interface ValueSetDetails {
  oid: string;
  version: string;
  codes: Array<{
    code: string;
    codeSystemURI: string;
    codeSystemName?: string;
    codeSystemVersion?: string;
    displayName?: string;
  }>;
}

export interface ValueSetSearchResult {
  oid: string;
  name: string;
  codeCount: number;
  steward?: string;
  experimental?: boolean;
  status?: string;
  lastReviewDate?: string;
  date?: string;
  description?: string;
  purpose?: {
    clinicalFocus?: string;
    dataElementScope?: string;
    inclusionCriteria?: string;
    exclusionCriteria?: string;
    purpose?: string;
  };
  [key: string]:
    | string
    | number
    | boolean
    | {
        clinicalFocus?: string;
        dataElementScope?: string;
        inclusionCriteria?: string;
        exclusionCriteria?: string;
        purpose?: string;
      }
    | undefined;
}

export interface ValueSetSearchResponse {
  count: number;
  total: number;
  results: ValueSetSearchResult[];
}

export interface TemplateEntry {
  id?: string;
  name?: string;
  value?:
    | string
    | number
    | boolean
    | { id?: string; name?: string; [key: string]: string | number | boolean | undefined };
  suppress?: boolean;
  [key: string]:
    | string
    | number
    | boolean
    | { id?: string; name?: string; [key: string]: string | number | boolean | undefined }
    | undefined;
}

export interface Template {
  name?: string;
  suppress?: boolean;
  entries?: TemplateEntry[];
  [key: string]: string | number | boolean | TemplateEntry[] | undefined;
}

export interface ConversionFunction {
  id: string;
  description?: string;
  value?: string;
  name?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Operator {
  id: string;
  name?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Resource {
  name?: string;
  supportedVersions?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ElmFile {
  name: string;
  content: string;
}

export interface CqlFile {
  name: string;
  text: string;
}

export interface ExternalCqlLibrary {
  _id: string;
  name?: string;
  version?: string;
  fhirVersion?: string;
  updatedAt?: string;
  createdAt?: string;
  details?: {
    parameters?: Array<{ name?: string; [key: string]: string | number | boolean | undefined }>;
    functions?: Array<{ name?: string; [key: string]: string | number | boolean | undefined }>;
    definitions?: Array<{ name?: string; [key: string]: string | number | boolean | undefined }>;
    [key: string]:
      | string
      | number
      | boolean
      | Array<{ name?: string; [key: string]: string | number | boolean | undefined }>
      | undefined;
  };
  [key: string]:
    | string
    | number
    | boolean
    | {
        parameters?: Array<{ name?: string; [key: string]: string | number | boolean | undefined }>;
        functions?: Array<{ name?: string; [key: string]: string | number | boolean | undefined }>;
        definitions?: Array<{ name?: string; [key: string]: string | number | boolean | undefined }>;
        [key: string]:
          | string
          | number
          | boolean
          | Array<{ name?: string; [key: string]: string | number | boolean | undefined }>
          | undefined;
      }
    | undefined;
}

export interface ValidationError {
  message?: string;
  line?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface ValidationWarning {
  message?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ValidateArtifactResponse {
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  cql?: string;
  [key: string]: string | number | boolean | ValidationError[] | ValidationWarning[] | undefined;
}

export interface ViewCqlResponse {
  cqlFiles?: CqlFile[];
  cql?: string;
  [key: string]: string | number | boolean | CqlFile[] | undefined;
}
