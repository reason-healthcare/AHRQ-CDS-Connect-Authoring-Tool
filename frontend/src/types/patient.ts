/**
 * Shared type definitions for Patient data structures
 * Uses FHIR R4 types where applicable
 */

import type fhir4 from 'fhir/r4';

export interface PatientEntry {
  resource: fhir4.Resource;
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
  timestamp?: string;
  total?: number;
  [key: string]: string | number | PatientEntry[] | fhir4.Resource | undefined;
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
