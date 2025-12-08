import type { ExternalCqlLibrary } from 'types/query';

interface EligibleElement {
  libraryName: string;
  elementName: string;
  type: 'definition' | 'function';
}

export const getExternalCqlByType = (
  externalCqlList: Array<
    ExternalCqlLibrary & {
      name?: string;
      details?: {
        definitions?: Array<{
          accessLevel?: string;
          calculatedReturnType?: string;
          name?: string;
          [key: string]: unknown;
        }>;
        functions?: Array<{
          accessLevel?: string;
          argumentTypes?: unknown;
          calculatedReturnType?: string;
          name?: string;
          [key: string]: unknown;
        }>;
        [key: string]: unknown;
      };
    }
  >,
  type: string
): EligibleElement[] => {
  if (!externalCqlList || externalCqlList.length === 0) return [];
  const eligibleElements: EligibleElement[] = [];
  externalCqlList.forEach(library => {
    library.details?.definitions?.forEach(definition => {
      if (definition.accessLevel === 'Public' && definition.calculatedReturnType === type) {
        eligibleElements.push({
          libraryName: library.name || '',
          elementName: definition.name || '',
          type: 'definition'
        });
      }
    });
    library.details?.functions?.forEach(func => {
      if (func.accessLevel === 'Public' && !func.argumentTypes && func.calculatedReturnType === type) {
        eligibleElements.push({
          libraryName: library.name || '',
          elementName: func.name || '',
          type: 'function'
        });
      }
    });
  });
  return eligibleElements;
};
