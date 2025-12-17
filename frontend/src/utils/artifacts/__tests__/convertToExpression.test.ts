import convertToExpression from '../convertToExpression';
import mockModifierList from 'mocks/modifiers/mockModifiers';

interface Modifier {
  id: string;
  name: string;
  type?: string;
  validator?: {
    type: string;
    fields: string[];
    args?: string[];
  };
  values?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ModifierValues {
  value?: unknown;
  unit?: string;
  qualifier?: string;
  valueSet?: { name?: string; oid?: string };
  code?: string | null;
  minOperator?: string;
  minValue?: string;
  maxOperator?: string;
  maxValue?: string;
  templateName?: string;
  description?: string;
  [key: string]: unknown;
}

interface ValueSet {
  name: string;
  oid?: string;
  [key: string]: unknown;
}

interface Code {
  code: string;
  display?: string;
  codeSystem: {
    name: string;
    id?: string;
  };
  [key: string]: unknown;
}

function getModifier(name: string, values?: ModifierValues): Modifier | undefined {
  const modifier = (mockModifierList as Array<{ id?: string; name?: string; [key: string]: unknown }>).find(
    (m: { id?: string; name?: string; [key: string]: unknown }) => m.id === name
  );
  if (modifier && modifier.id && modifier.name) {
    const result: Modifier = {
      id: modifier.id,
      name: modifier.name,
      ...modifier
    };
    if (values) {
      result.values = values;
    }
    return result;
  }
  return undefined;
}

it('Simple modifiers Active, Confirmed, Exists builds expected phrase', () => {
  const modifiers = [
    getModifier('ActiveCondition'),
    getModifier('ConfirmedCondition'),
    getModifier('BooleanExists')
  ].filter((m): m is Modifier => m !== undefined);
  const name = 'Condition';
  const valueSets: ValueSet[] = [{ name: 'Diabetes', oid: '1.2.3' }];
  const codes: Code[] = [];
  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'boolean');

  const expectedOutput = [
    { label: 'There', isTag: false },
    { label: 'exists', isTag: true },
    { label: 'an', isTag: false },
    { label: 'active', isTag: true },
    { label: 'confirmed', isTag: true },
    { label: 'condition', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'Diabetes', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

// MostRecent starts the list, Qualifier added correctly, LookBack added correctly, ConceptValue not added to phrase
it('More complicated modifiers, including Qualifier, builds expected phrase', () => {
  const modifiers = [
    getModifier('VerifiedObservation'),
    getModifier('LookBackObservation', { value: 14, unit: 'years' }),
    getModifier('MostRecentObservation'),
    getModifier('ConceptValue'),
    getModifier('Qualifier', {
      qualifier: 'value is a code from',
      valueSet: {
        name: 'Smoker',
        oid: '1.2.3'
      },
      code: null
    })
  ].filter((m): m is Modifier => m !== undefined);

  const name = 'Observation';
  const valueSets = [{ name: 'LDL', oid: '1.2.3' }];
  const codes: Code[] = [];

  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'boolean');

  const expectedOutput = [
    { label: 'There exists', isTag: false },
    { label: 'the', isTag: false },
    { label: 'most recent', isTag: true },
    { label: 'verified', isTag: true },
    { label: 'observation', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'LDL', isTag: true },
    { label: 'which occurred', isTag: false },
    { label: 'within the last 14 years', isTag: true },
    { label: 'whose value is a code from Smoker', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

// MostRecent starts the list, ValueComparison, WithUnit, ConvertUnits all added correctly
it('More complicated modifiers, including Value Comparison, builds correct phrase', () => {
  const modifiers = [
    getModifier('VerifiedObservation'),
    getModifier('WithUnit', { unit: 'mg/dL' }),
    getModifier('MostRecentObservation'),
    getModifier('QuantityValue'),
    getModifier('ConvertObservation', {
      value: 'Convert.mg_per_dL',
      templateName: 'Convert.mg_per_dL',
      description: 'mmol/L to mg/dL for blood cholesterol'
    }),
    getModifier('ValueComparisonObservation', {
      minOperator: '>=',
      minValue: '120',
      maxOperator: '<',
      maxValue: '300',
      unit: 'mg/dL'
    })
  ].filter((m): m is Modifier => m !== undefined);

  const name = 'Observation';
  const valueSets = [{ name: 'LDL', oid: '1.2.3' }];
  const codes: Code[] = [];

  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'boolean');

  const expectedOutput = [
    { label: 'There exists', isTag: false },
    { label: 'the', isTag: false },
    { label: 'most recent', isTag: true },
    { label: 'verified', isTag: true },
    { label: 'observation', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'LDL', isTag: true },
    { label: 'with unit', isTag: false },
    { label: 'mg/dL', isTag: true },
    { label: 'with', isTag: false },
    { label: 'units converted from mmol/L to mg/dL for blood cholesterol', isTag: true },
    { label: 'whose value', isTag: false },
    { label: 'is greater than or equal to 120 mg/dL and is less than 300 mg/dL', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

// Highest starts the list, Not is at the beginning of expression, is null added to end
it('More complicated expression, with Highest, Not, and Is Null, builds correct phrase', () => {
  const modifiers = [
    getModifier('VerifiedObservation'),
    getModifier('HighestObservationValue'),
    getModifier('CheckExistence', { value: 'is null' }),
    getModifier('BooleanNot')
  ].filter((m): m is Modifier => m !== undefined);

  const name = 'Observation';
  const valueSets: ValueSet[] = [];
  const codes: Code[] = [
    {
      code: '123-4',
      codeSystem: { name: 'CodeSystemName', id: '123' },
      display: 'test code'
    }
  ];

  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'boolean');

  const expectedOutput = [
    { label: 'It is', isTag: false },
    { label: 'not', isTag: true },
    { label: 'the case that', isTag: false },
    { label: 'the', isTag: false },
    { label: 'highest', isTag: true },
    { label: 'verified', isTag: true },
    { label: 'observation', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'test code', isTag: true },
    { label: 'is null', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

it('Only validated modifiers are added to the phrase', () => {
  const modifiers = [
    getModifier('CheckExistence', { value: undefined }) // not filled in
  ].filter((m): m is Modifier => m !== undefined);

  const name = 'Observation';
  const valueSets = [{ name: 'LDL', oid: '1.2.3' }];
  const codes: Code[] = [];

  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'list_of_observations');

  // Only modifiers that are validated are added
  const expectedOutput = [
    { label: 'Observations', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'LDL', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

// Multiple value sets and codes (with and without a display) are added correctly to phrase and tooltip text
it('All value sets and codes are added to phrase, but only first three are displayed, rest in tooltip text', () => {
  const modifiers = [getModifier('BooleanExists')].filter((m): m is Modifier => m !== undefined);

  const name = 'Observation';
  const valueSets: ValueSet[] = [
    { name: 'LDL', oid: '1.2.3' },
    { name: 'HDL', oid: '3.2.1' }
  ];
  const codes: Code[] = [
    { code: '123-4', codeSystem: { name: 'CS1', id: '123' }, display: 'Test code' },
    { code: '432-1', codeSystem: { name: 'CS2', id: '321' } }
  ];

  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'boolean');

  const expectedOutput = [
    { label: 'There', isTag: false },
    { label: 'exists', isTag: true },
    { label: 'an', isTag: false },
    { label: 'observation', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'LDL', isTag: true },
    { label: ',', isTag: false },
    { label: 'HDL', isTag: true },
    { label: ',', isTag: false },
    { label: 'Test code', isTag: true },
    { label: ',', isTag: false },
    { label: 'or', isTag: false },
    { label: '...', isTag: true, tooltipText: '...or 432-1 (CS2)' }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

it('Elements that have a return type of a list indicates plurality in the phrase', () => {
  const modifiers: Modifier[] = [];

  const name = 'Observation';
  const valueSets = [{ name: 'LDL', oid: '1.2.3' }];
  const codes: Code[] = [];

  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'list_of_observations');

  const expectedOutput = [
    { label: 'Observations', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'LDL', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

describe('Demographics elements support special case phrases', () => {
  it('Age Range supports min and max age', () => {
    const modifiers: Modifier[] = [];
    const name = 'Age Range';
    const ages = [
      { id: 'min_age', name: 'Minimum Age', type: 'number', typeOfNumber: 'integer', value: 18 },
      { id: 'max_age', name: 'Maximum Age', type: 'number', typeOfNumber: 'integer', value: 70 },
      {
        id: 'unit_of_time',
        name: 'Unit of Time',
        type: 'valueset',
        select: 'demographics/units_of_time',
        value: {
          id: 'a',
          name: 'years',
          value: 'AgeInYears()'
        }
      }
    ];

    const expressionPhrase = convertToExpression(modifiers, name, [], [], 'boolean', ages);

    const expectedOutput = [
      { label: "The patient's", isTag: false },
      { label: 'age', isTag: false, isType: true },
      { label: 'is', isTag: false },
      { label: 'between', isTag: false },
      { label: '18 years', isTag: true },
      { label: 'and', isTag: false },
      { label: '70 years', isTag: true }
    ];

    expect(expressionPhrase).toEqual(expectedOutput);
  });
  it('Gender supports gender selection', () => {
    const modifiers: Modifier[] = [];
    const name = 'Gender';
    const gender = [
      {
        id: 'gender',
        name: 'Gender',
        select: 'demographics/gender',
        type: 'valueset',
        value: { id: 'male', name: 'Male', value: 'male' }
      }
    ];

    const expressionPhrase = convertToExpression(modifiers, name, [], [], 'boolean', gender);

    const expectedOutput = [
      { label: "The patient's", isTag: false },
      { label: 'gender', isTag: false, isType: true },
      { label: 'is', isTag: false },
      { label: 'Male', isTag: true }
    ];

    expect(expressionPhrase).toEqual(expectedOutput);
  });
});

it("Base Element Lists create a phrase with individual element's phrases in a tooltip", () => {
  const modifiers = [getModifier('BooleanExists')].filter((m): m is Modifier => m !== undefined);

  const name = 'Union';
  const valueSets: ValueSet[] = [];
  const codes: Code[] = [];
  const returnType = 'boolean';
  const otherFields: Array<{ id?: string; value?: unknown; [key: string]: unknown }> = [];
  const elementNamesInPhrase = [
    { name: 'Test Name', tooltipText: 'Phrase for Test Name' },
    { name: 'Other', tooltipText: 'Another phrase' }
  ];

  const expressionPhrase = convertToExpression(
    modifiers,
    name,
    valueSets,
    codes,
    returnType,
    otherFields,
    elementNamesInPhrase
  );

  const expectedOutput = [
    { label: 'There', isTag: false },
    { label: 'exists', isTag: true },
    { label: 'a', isTag: false },
    { label: 'union', isTag: false, isType: true },
    { label: 'of', isTag: false },
    { label: 'Test Name', isTag: true, tooltipText: 'Phrase for Test Name', isName: true },
    { label: 'and', isTag: false },
    { label: 'Other', isTag: true, tooltipText: 'Another phrase', isName: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

it("Conjunction Groups create a phrase with the group's children 1 level deep and its type", () => {
  const modifiers: Modifier[] = [];

  const name = 'Or';
  const valueSets: ValueSet[] = [];
  const codes: Code[] = [];
  const returnType = 'boolean';
  const otherFields: Array<{ id?: string; value?: unknown; [key: string]: unknown }> = [];
  const elementNamesInPhrase = [{ name: 'Child 1' }, { name: 'Child 2' }, { name: 'Group Child' }];

  const expressionPhrase = convertToExpression(
    modifiers,
    name,
    valueSets,
    codes,
    returnType,
    otherFields,
    elementNamesInPhrase
  );

  const expectedOutput = [
    { label: 'Child 1', isTag: true, isName: true },
    { label: ',', isTag: false },
    { label: 'Child 2', isTag: true, isName: true },
    { label: ',', isTag: false },
    { label: 'or', isTag: false, isType: true },
    { label: 'Group Child', isTag: true, isName: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

it('Parameters with BooleanNot create a phrase with the parameter name', () => {
  const modifiers = [getModifier('BooleanNot')].filter((m): m is Modifier => m !== undefined);

  const name = 'parameter';
  const valueSets: ValueSet[] = [];
  const codes: Code[] = [];
  const returnType = 'boolean';
  const otherFields: Array<{ id?: string; value?: unknown; [key: string]: unknown }> = [];
  const elementNamesInPhrase: Array<{ name: string; tooltipText?: string }> = [];
  const parameterName = 'Original Param';

  const expressionPhrase = convertToExpression(
    modifiers,
    name,
    valueSets,
    codes,
    returnType,
    otherFields,
    elementNamesInPhrase,
    false,
    parameterName
  );

  const expectedOutput = [
    { label: 'Not', isTag: true },
    { label: 'the', isTag: false },
    { label: 'parameter', isTag: false, isType: true },
    { label: 'Original Param', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

it('Quantity parameters with Value Comparison create a phrase with the parameter name and comparison', () => {
  const modifiers = [
    getModifier('ValueComparisonObservation', {
      minOperator: '>=',
      minValue: '120',
      maxOperator: '<',
      maxValue: '300',
      unit: 'mg/dL'
    })
  ].filter((m): m is Modifier => m !== undefined);

  const name = 'parameter';
  const valueSets: ValueSet[] = [];
  const codes: Code[] = [];
  const returnType = 'boolean';
  const otherFields: Array<{ id?: string; value?: unknown; [key: string]: unknown }> = [];
  const elementNamesInPhrase: Array<{ name: string; tooltipText?: string }> = [];
  const parameterName = 'Original Param';

  const expressionPhrase = convertToExpression(
    modifiers,
    name,
    valueSets,
    codes,
    returnType,
    otherFields,
    elementNamesInPhrase,
    false,
    parameterName
  );

  const expectedOutput = [
    { label: 'The', isTag: false },
    { label: 'parameter', isTag: false, isType: true },
    { label: 'Original Param', isTag: true },
    { label: 'is greater than or equal to 120 mg/dL and is less than 300 mg/dL', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

it('Count expression builds phrase that uses the count as the subject of the phrase', () => {
  const modifiers = [
    getModifier('Count'),
    getModifier('ValueComparisonNumber', {
      minOperator: '>',
      minValue: '10',
      maxOperator: undefined,
      maxValue: '',
      unit: ''
    })
  ].filter((m): m is Modifier => m !== undefined);

  const name = 'Observation';
  const valueSets: ValueSet[] = [{ name: 'LDL', oid: '1.2.3' }];
  const codes: Code[] = [];
  const returnType = 'boolean';

  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, returnType);

  const expectedOutput = [
    { label: 'The', isTag: false },
    { label: 'count', isTag: true },
    { label: 'of', isTag: false },
    { label: 'observations', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'LDL', isTag: true },
    { label: 'is greater than 10', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

it('Immunization Phrases', () => {
  const modifiers = [
    getModifier('LookBackImmunization', { value: 6, unit: 'years' }),
    getModifier('CompletedImmunization'),
    getModifier('MostRecentImmunization'),
    getModifier('CheckExistence', { value: 'is not null' })
  ].filter((m): m is Modifier => m !== undefined);
  const name = 'Immunization';
  const valueSets: ValueSet[] = [{ name: 'FluVaccines', oid: '1.2.3' }];
  const codes: Code[] = [];
  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'boolean');

  const expectedOutput = [
    { label: 'The', isTag: false },
    { label: 'most recent', isTag: true },
    { label: 'completed', isTag: true },
    { label: 'immunization', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'FluVaccines', isTag: true },
    { label: 'which occurred', isTag: false },
    { label: 'within the last 6 years', isTag: true },
    { label: 'is not null', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});

it('Device Phrases', () => {
  const modifiers = [getModifier('ActiveDevice'), getModifier('BooleanExists')].filter(
    (m): m is Modifier => m !== undefined
  );
  const name = 'Device';
  const valueSets: ValueSet[] = [{ name: 'PaceMakers', oid: '1.2.3' }];
  const codes: Code[] = [];
  const expressionPhrase = convertToExpression(modifiers, name, valueSets, codes, 'boolean');

  const expectedOutput = [
    { label: 'There', isTag: false },
    { label: 'exists', isTag: true },
    { label: 'an', isTag: false },
    { label: 'active', isTag: true },
    { label: 'device', isTag: false, isType: true },
    { label: 'with a code from', isTag: false },
    { label: 'PaceMakers', isTag: true }
  ];

  expect(expressionPhrase).toEqual(expectedOutput);
});
