/**
 * API request/response type definitions
 * These types define the contract for API endpoints
 */

import type { ArtifactStructure } from './artifact';

// Authenticated request type (Express)
export interface AuthenticatedRequest {
  user?: {
    uid: string;
    [key: string]: unknown;
  };
  params?: Record<string, string>;
  body?: unknown;
  query?: Record<string, unknown>;
  [key: string]: unknown;
}

// Artifact API endpoints
export interface GetArtifactsResponse {
  artifacts: ArtifactStructure[];
}

export interface GetArtifactResponse {
  artifact: ArtifactStructure;
}

export interface CreateArtifactRequest {
  artifact: ArtifactStructure;
}

export interface CreateArtifactResponse {
  artifact: ArtifactStructure;
}

export interface UpdateArtifactRequest {
  artifact: ArtifactStructure;
}

export interface UpdateArtifactResponse {
  artifact: ArtifactStructure;
}

// Patient API endpoints
export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'collection';
  entry: Array<{
    resource: unknown;
    fullUrl?: string;
    request?: {
      url?: string;
      method?: string;
    };
  }>;
  id?: string;
  timestamp?: string;
  total?: number;
  [key: string]: unknown;
}

export interface GetPatientsResponse {
  patients: Array<{
    _id: string;
    patient: FHIRBundle;
    updatedAt?: string;
    createdAt?: string;
  }>;
}

export interface CreatePatientRequest {
  patient: FHIRBundle;
}

export interface CreatePatientResponse {
  patient: {
    _id: string;
    patient: FHIRBundle;
    updatedAt?: string;
    createdAt?: string;
  };
}

