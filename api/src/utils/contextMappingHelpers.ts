/**
 * Helper functions for working with context mappings
 */

import type { Coding } from 'fhir/r4';

interface ContextMapping {
  type: string;
  system: string;
  [key: string]: string | Coding | Record<string, string> | undefined;
}

/**
 * Safely gets a code/display value from a context mapping
 * Context mappings have structure like: { type: 'gender', system: '...', male: { code, display }, female: { code, display }, ... }
 */
export function getContextMappingValue(
  ctxMap: ContextMapping | undefined,
  code: string
): Coding | undefined {
  if (!ctxMap) return undefined;

  const value = ctxMap[code];
  if (value && typeof value === 'object' && 'code' in value && 'display' in value) {
    return value as Coding;
  }
  return undefined;
}

/**
 * Gets the system from a context mapping
 */
export function getContextMappingSystem(ctxMap: ContextMapping | undefined): string {
  return ctxMap?.system || '';
}

