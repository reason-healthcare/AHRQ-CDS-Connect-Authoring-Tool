/**
 * Shared type definitions for Patient data structures
 * Uses FHIR R4 types where applicable
 */

export interface PatientEntry {
  resource: {
    resourceType: string;
    [key: string]: unknown;
  };
  fullUrl?: string;
  request?: {
    url?: string;
    method?: string;
  };
}

export interface PatientBundle {
  resourceType: 'Bundle';
  type: 'collection';
  entry: PatientEntry[];
  id?: string;
}

export interface PatientData {
  fhirVersion?: string;
  patient?: PatientBundle;
  entry?: PatientEntry[];
  resourceType?: string;
  _id?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface Patient {
  _id: string;
  patient: PatientBundle;
  updatedAt?: string;
  createdAt?: string;
}
