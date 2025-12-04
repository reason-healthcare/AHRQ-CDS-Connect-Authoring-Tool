import axios from 'axios';
import _ from 'lodash';
import type { Operator } from '../../types/query';

interface FetchOperatorsParams {
  type: string;
  elementType: string;
}

const fetchOperators = async ({ type: typeSpecifier, elementType }: FetchOperatorsParams): Promise<Operator[]> => {
  const { data: implicitConversionInfo } = await axios.get<{ FHIRToSystem?: Record<string, string> }>(
    `${process.env.REACT_APP_API_URL}/query/implicitconversion`
  );
  const systemElementType = implicitConversionInfo.FHIRToSystem?.[elementType];

  let baseTypeOperators: { data: Operator[] };
  let conversionTypeOperators: Operator[] | null = null;
  if (systemElementType) {
    let convertedTargetType: string | undefined;
    let convertedTargetElementType: string | undefined;
    if (systemElementType?.startsWith('Interval<')) {
      const match = /Interval<(.+)>/.exec(systemElementType);
      convertedTargetElementType = match ? match[1] : undefined;
      convertedTargetType = 'IntervalTypeSpecifier';
    } else if (systemElementType?.startsWith('List<')) {
      const match = /List<(.+)>/.exec(systemElementType);
      convertedTargetElementType = match ? match[1] : undefined;
      convertedTargetType = 'ListTypeSpecifier';
    } else if (systemElementType) {
      convertedTargetElementType = systemElementType;
      // keep typespecifier so it behaves such that:
      // * FHIR.CodeableConcept -> System.Concept
      // * List<FHIR.CodeableConcept> -> List<System.Concept>
      convertedTargetType = typeSpecifier;
    }
    if (convertedTargetType && convertedTargetElementType) {
      conversionTypeOperators = (
        await axios.get<Operator[]>(`${process.env.REACT_APP_API_URL}/query/operator`, {
          params: { typeSpecifier: convertedTargetType, elementType: convertedTargetElementType }
        })
      ).data;
    }
  }

  baseTypeOperators = await axios.get<Operator[]>(
    `${process.env.REACT_APP_API_URL}/query/operator?typeSpecifier=${typeSpecifier}&elementType=${elementType}`
  );

  const matchingOperators = conversionTypeOperators
    ? _.uniqBy([...conversionTypeOperators, ...baseTypeOperators.data], (operator: { id?: string }) => operator.id)
    : baseTypeOperators.data;

  if (matchingOperators.length === 0) throw new Error('Error: No operators Found.');
  return matchingOperators;
};

export default fetchOperators;
