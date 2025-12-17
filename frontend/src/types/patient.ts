/**
 * Shared type definitions for Patient data structures
 * Uses FHIR R4 types where applicable
 */

// Note: We don't import fhir4 here to avoid forcing R4-only types
// PatientEntry.resource needs to support all FHIR versions (DSTU2, STU3, R4)
// Using fhir4.Resource was too strict and broke DSTU2 compatibility
import type fhir4 from 'fhir/r4';
import type fhir3 from 'fhir/r3';
import type fhir2 from 'fhir/r2';

export type FHIRBundle = fhir4.Bundle | fhir3.Bundle | fhir2.Bundle;
export type FHIRBundleEntry = fhir4.BundleEntry | fhir3.BundleEntry | fhir2.BundleEntry;

export interface PatientData {
  fhirVersion?: string;
  patient?: FHIRBundle;
  entry?: FHIRBundleEntry[];
  _id?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface Patient {
  _id: string;
  patient: FHIRBundle;
  fhirVersion?: string;
  updatedAt?: string;
  createdAt?: string;
}
