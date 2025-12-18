/**
 * Helper functions for working with context mappings
 */

interface ContextMappingValue {
  code: string;
  display: string;
}

interface ContextMapping {
  type: string;
  system: string;
  [key: string]: string | ContextMappingValue | Record<string, string> | undefined;
}

/**
 * Safely gets a code/display value from a context mapping
 * Context mappings have structure like: { type: 'gender', system: '...', male: { code, display }, female: { code, display }, ... }
 */
export function getContextMappingValue(
  ctxMap: ContextMapping | undefined,
  code: string
): ContextMappingValue | undefined {
  if (!ctxMap) return undefined;

  const value = ctxMap[code];
  if (value && typeof value === 'object' && 'code' in value && 'display' in value) {
    return value as ContextMappingValue;
  }
  return undefined;
}

/**
 * Gets the system from a context mapping
 */
export function getContextMappingSystem(ctxMap: ContextMapping | undefined): string {
  return ctxMap?.system || '';
}
