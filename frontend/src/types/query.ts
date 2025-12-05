/**
 * Shared type definitions for API query responses
 */

export interface ValueSetDetails {
  oid: string;
  version: string;
  codes: Array<{
    code: string;
    codeSystemURI: string;
    codeSystemVersion?: string;
    displayName?: string;
  }>;
}

export interface ValueSetSearchResult {
  codeCount: number;
  [key: string]: unknown;
}

export interface ValueSetSearchResponse {
  count: number;
  total: number;
  results: ValueSetSearchResult[];
}

export interface Template {
  name?: string;
  entries?: Array<{ name?: string }>;
}

export interface ConversionFunction {
  id: string;
  description?: string;
  value?: string;
  name?: string;
  [key: string]: unknown;
}

export interface Operator {
  id: string;
  [key: string]: unknown;
}

export interface Resource {
  [key: string]: unknown;
}

export interface ElmFile {
  name: string;
  content: string;
}

export interface ExternalCqlLibrary {
  _id: string;
  name?: string;
  [key: string]: unknown;
}

export interface ValidateArtifactResponse {
  errors?: unknown[];
  warnings?: unknown[];
  cql?: string;
  [key: string]: unknown;
}

export interface ViewCqlResponse {
  cql?: string;
  [key: string]: unknown;
}
