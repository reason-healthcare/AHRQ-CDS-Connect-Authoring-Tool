interface EditorErrors {
  incompleteInput?: boolean;
  invalidInput?: boolean;
}

interface EditorErrorResult {
  errors: EditorErrors;
  hasErrors: boolean;
}

interface CqlArgument {
  operandTypeSpecifier?: {
    pointType?: { resultTypeName?: string };
    resultTypeName?: string;
    resultTypeSpecifier?: {
      type?: string;
      elementType?: { name?: string };
    };
  };
}

export const isSupportedEditorType = (editorType: string | null | undefined): boolean => {
  if (!editorType) return false;

  const supportedEditorTypes = [
    'boolean',
    'datetime',
    'decimal',
    'integer',
    'interval_of_datetime',
    'interval_of_decimal',
    'interval_of_integer',
    'interval_of_quantity',
    'string',
    'system_code',
    'system_concept',
    'system_quantity',
    'time'
  ];

  return supportedEditorTypes.includes(editorType);
};

export function getTypeByCqlArgument(cqlArgument: CqlArgument): string | undefined {
  // Supported non-interval types

  // Note: there is a large overlap between this type map and one stored
  // in the backend in the file api/src/handlers/cqlHandler.js
  // If you update something here, be sure to update it there
  const argumentTypeMap: Record<string, string> = {
    '{urn:hl7-org:elm-types:r1}Boolean': 'boolean',
    '{urn:hl7-org:elm-types:r1}Code': 'system_code',
    '{urn:hl7-org:elm-types:r1}Concept': 'system_concept',
    '{urn:hl7-org:elm-types:r1}DateTime': 'datetime',
    '{urn:hl7-org:elm-types:r1}Decimal': 'decimal',
    '{urn:hl7-org:elm-types:r1}Integer': 'integer',
    '{urn:hl7-org:elm-types:r1}Quantity': 'system_quantity',
    '{urn:hl7-org:elm-types:r1}String': 'string',
    '{urn:hl7-org:elm-types:r1}Time': 'time'
  };

  // Supported interval types
  const intervalArgumentTypeMap: Record<string, string> = {
    '{urn:hl7-org:elm-types:r1}DateTime': 'interval_of_datetime',
    '{urn:hl7-org:elm-types:r1}Decimal': 'interval_of_decimal',
    '{urn:hl7-org:elm-types:r1}Integer': 'interval_of_integer',
    '{urn:hl7-org:elm-types:r1}Quantity': 'interval_of_quantity'
  };

  // Supported FHIR types
  const fhirTypeMap: Record<string, string> = {
    '{http://hl7.org/fhir}AllergyIntolerance': 'allergy_intolerance',
    '{http://hl7.org/fhir}Condition': 'condition',
    '{http://hl7.org/fhir}Device': 'device',
    '{http://hl7.org/fhir}Encounter': 'encounter',
    '{http://hl7.org/fhir}Immunization': 'immunization',
    '{http://hl7.org/fhir}MedicationRequest': 'medication_request',
    '{http://hl7.org/fhir}MedicationStatement': 'medication_statement',
    '{http://hl7.org/fhir}MedicationOrder': 'medication_order',
    '{http://hl7.org/fhir}Observation': 'observation',
    '{http://hl7.org/fhir}Procedure': 'procedure',
    '{http://hl7.org/fhir}ServiceRequest': 'service_request'
  };

  const operandTypeSpecifier = cqlArgument.operandTypeSpecifier;
  const isInterval = Boolean(operandTypeSpecifier?.pointType?.resultTypeName);
  const typeName =
    operandTypeSpecifier?.pointType?.resultTypeName ||
    operandTypeSpecifier?.resultTypeName ||
    operandTypeSpecifier?.resultTypeSpecifier?.elementType?.name;
  if (typeName && typeName.startsWith('{http://hl7.org/fhir}'))
    return operandTypeSpecifier?.resultTypeSpecifier?.type !== 'ListTypeSpecifier'
      ? fhirTypeMap[typeName]
      : `list_of_${fhirTypeMap[typeName]}s`;
  else return isInterval && typeName ? intervalArgumentTypeMap[typeName] : typeName ? argumentTypeMap[typeName] : undefined;
}

// errors

const isBlank = (value: unknown): boolean => value === '' || value == null;
const isValidDecimal = (value: string): boolean => /^-?\d+(\.\d+)?$/.test(value);
const isValidInteger = (value: string): boolean => /^-?\d+$/.test(value);

interface DateTimeValue {
  time?: string;
  date?: string;
}

interface IntervalDateTimeValue {
  firstTime?: string;
  firstDate?: string;
  secondTime?: string;
  secondDate?: string;
}

interface DecimalValue {
  decimal?: string;
}

interface IntervalDecimalValue {
  firstDecimal?: string;
  secondDecimal?: string;
}

interface QuantityValue {
  quantity?: string;
  unit?: string;
}

interface IntervalQuantityValue {
  firstQuantity?: string;
  secondQuantity?: string;
  unit?: string;
}

interface IntervalIntegerValue {
  firstInteger?: string;
  secondInteger?: string;
}

type EditorValue =
  | string
  | number
  | DateTimeValue
  | IntervalDateTimeValue
  | DecimalValue
  | IntervalDecimalValue
  | QuantityValue
  | IntervalQuantityValue
  | IntervalIntegerValue
  | null
  | undefined;

const editorErrors = (type: string, value: EditorValue): EditorErrors => {
  switch (type) {
    case 'datetime': {
      const dtValue = value as DateTimeValue | undefined;
      return { incompleteInput: Boolean(dtValue?.time && !dtValue?.date) };
    }

    case 'interval_of_datetime': {
      const idtValue = value as IntervalDateTimeValue | undefined;
      return {
        incompleteInput: Boolean(
          (idtValue?.firstTime && !idtValue?.firstDate) || (idtValue?.secondTime && !idtValue?.secondDate)
        )
      };
    }

    case 'decimal': {
      const decValue = value as DecimalValue | undefined;
      return { invalidInput: !isBlank(decValue?.decimal) && !isValidDecimal(decValue?.decimal || '') };
    }

    case 'interval_of_decimal': {
      const idecValue = value as IntervalDecimalValue | undefined;
      return {
        invalidInput:
          (!isBlank(idecValue?.firstDecimal) && !isValidDecimal(idecValue?.firstDecimal || '')) ||
          (!isBlank(idecValue?.secondDecimal) && !isValidDecimal(idecValue?.secondDecimal || ''))
      };
    }

    case 'integer':
      return { invalidInput: !isBlank(value) && !isValidInteger(String(value)) };

    case 'interval_of_integer': {
      const iintValue = value as IntervalIntegerValue | undefined;
      return {
        invalidInput:
          (!isBlank(iintValue?.firstInteger) && !isValidInteger(iintValue?.firstInteger || '')) ||
          (!isBlank(iintValue?.secondInteger) && !isValidInteger(iintValue?.secondInteger || ''))
      };
    }

    case 'system_quantity': {
      const qtyValue = value as QuantityValue | undefined;
      return {
        invalidInput: Boolean(qtyValue) && !isBlank(qtyValue?.quantity) && !isValidDecimal(qtyValue?.quantity || ''),
        incompleteInput: Boolean(qtyValue?.unit) && isBlank(qtyValue?.quantity)
      };
    }

    case 'interval_of_quantity': {
      const iqtyValue = value as IntervalQuantityValue | undefined;
      return {
        invalidInput:
          Boolean(iqtyValue) &&
          ((!isBlank(iqtyValue?.firstQuantity) && !isValidDecimal(iqtyValue?.firstQuantity || '')) ||
            (!isBlank(iqtyValue?.secondQuantity) && !isValidDecimal(iqtyValue?.secondQuantity || ''))),
        incompleteInput:
          Boolean(iqtyValue?.unit) && isBlank(iqtyValue?.firstQuantity) && isBlank(iqtyValue?.secondQuantity)
      };
    }

    default:
      return {};
  }
};

const hasErrors = (type: string, errors: EditorErrors): boolean => {
  switch (type) {
    case 'datetime':
    case 'interval_of_datetime':
      return Boolean(errors.incompleteInput);

    case 'decimal':
    case 'integer':
    case 'interval_of_decimal':
    case 'interval_of_integer':
      return Boolean(errors.invalidInput);

    case 'system_quantity':
    case 'interval_of_quantity':
      return Boolean(errors.invalidInput || errors.incompleteInput);

    default:
      return false;
  }
};

export const getEditorErrors = (type: string, value: EditorValue): EditorErrorResult => {
  const errors = editorErrors(type, value);

  return {
    errors,
    hasErrors: hasErrors(type, errors)
  };
};

