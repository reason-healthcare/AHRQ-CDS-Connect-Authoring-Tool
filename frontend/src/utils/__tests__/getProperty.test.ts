import getProperty from '../getProperty';

interface TestObject {
  [key: string]: unknown;
}

describe('getProperty', () => {
  describe('simple properties', () => {
    const weightObs: TestObject = {
      resourceType: 'Observation',
      status: 'final',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '3141-9', display: 'Weight Measured' },
          { system: 'http://snomed.info/sct', code: '27113001', display: 'Body weight' }
        ]
      },
      valueQuantity: { value: 185, unit: 'lbs', system: 'http://unitsofmeasure.org', code: '[lb_av]' }
    };

    it('should get a simple top-level property', () => {
      expect(getProperty(weightObs, 'status')).toEqual('final');
    });

    it('should get a simple nested property', () => {
      expect(getProperty(weightObs, 'valueQuantity.value')).toEqual('185');
    });

    it('should get a simple property using firstObject', () => {
      expect(getProperty(weightObs, 'code.coding.firstObject.code')).toEqual('3141-9');
    });
  });

  describe('property parsers', () => {
    // Note: There's nothing in the code that requires these to be valid FHIR objects
    // so we're using simple objects for testing purposes.

    it('should get a Coding property', () => {
      const obj: TestObject = {
        foo: { system: 'http://snomed.info/sct', code: '73211009', display: 'Diabetes mellitus (disorder)' }
      };
      expect(getProperty(obj, 'Coding:foo')).toEqual('Diabetes mellitus (disorder)');
    });

    it('should get a CodeableConcept property', () => {
      const obj: TestObject = {
        foo: {
          coding: [{ system: 'http://snomed.info/sct', code: '73211009', display: 'Diabetes mellitus (disorder)' }],
          text: 'Diabetes'
        }
      };
      expect(getProperty(obj, 'CodeableConcept:foo')).toEqual('Diabetes');
    });

    it('should get a Quantity property', () => {
      const obj: TestObject = {
        foo: { value: 4.5, system: 'ttp://unitsofmeasure.org', code: 'a', unit: 'year' }
      };
      expect(getProperty(obj, 'Quantity:foo')).toEqual('4.5 a');
    });

    it('should get a Range property', () => {
      const obj: TestObject = {
        foo: {
          low: { value: 2, system: 'ttp://unitsofmeasure.org', code: 'wk' },
          high: { value: 6, system: 'ttp://unitsofmeasure.org', code: 'wk' }
        }
      };
      expect(getProperty(obj, 'Range:foo')).toEqual('2 wk - 6 wk');
    });

    it('should get a Ratio property', () => {
      const obj: TestObject = {
        foo: {
          numerator: { value: 120, system: 'ttp://unitsofmeasure.org', code: 'ml' },
          denominator: { value: 4, system: 'ttp://unitsofmeasure.org', code: 'd' }
        }
      };
      expect(getProperty(obj, 'Ratio:foo')).toEqual('120 ml / 4 d');
    });

    it('should get a Period property', () => {
      const obj: TestObject = {
        foo: {
          start: '2001-01-01',
          end: '2003-05-12'
        }
      };
      expect(getProperty(obj, 'Period:foo')).toEqual('2001-01-01 - 2003-05-12');
    });

    it('should get an Identifier property', () => {
      const obj: TestObject = {
        foo: { use: 'official', system: 'urn:oid:2.16.840.1.113883.16.4.3.2.5', value: '123' }
      };
      expect(getProperty(obj, 'Identifier:foo')).toEqual('123');
    });

    it('should get a HumanName property', () => {
      const obj: TestObject = {
        foo: { text: 'Bob Smith', family: ['Smith'], given: ['Robert'] }
      };
      expect(getProperty(obj, 'HumanName:foo')).toEqual('Bob Smith');
    });

    it('should get an Annotation property', () => {
      const obj: TestObject = {
        foo: { text: "Don't worry. Everything is fine." }
      };
      expect(getProperty(obj, 'Annotation:foo')).toEqual("Don't worry. Everything is fine.");
    });

    it('should get an Address property', () => {
      const obj: TestObject = {
        foo: {
          line: ['1050 W Wishard Blvd'],
          city: 'Indianapolis',
          state: 'IN',
          postalCode: '46240',
          country: 'USA'
        }
      };
      expect(getProperty(obj, 'Address:foo')).toEqual('Indianapolis, IN, USA');
    });

    it('should get a ContactPoint property', () => {
      const obj: TestObject = {
        foo: { system: 'phone', value: '555-555-1212' }
      };
      expect(getProperty(obj, 'ContactPoint:foo')).toEqual('555-555-1212');
    });

    it('should get a Reference property', () => {
      const obj: TestObject = {
        foo: { reference: 'Practitioner/123', display: 'Dr. Jones' }
      };
      expect(getProperty(obj, 'Reference:foo')).toEqual('Dr. Jones');
    });

    it('should get a SampledData property', () => {
      const obj: TestObject = {
        foo: {
          origin: { value: 0, system: 'ttp://unitsofmeasure.org', code: 'uV' },
          period: 2,
          factor: 2.5,
          dimensions: 1,
          value: '-4 -13 -18 -18 -18 -17 -16 -16 -16 -16 -16 -17 -18 -18 -18'
        }
      };
      expect(getProperty(obj, 'SampledData:foo')).toEqual('<sampled data>');
    });

    it('should get an Attachment property', () => {
      const obj: TestObject = {
        foo: { contentType: 'application/pdf', language: 'en', data: '<data-goes-here>', title: 'Sample PDF' }
      };
      expect(getProperty(obj, 'Attachment:foo')).toEqual('<attachment>');
    });

    it('should get a Timing property', () => {
      const obj: TestObject = {
        foo: { repeat: { frequency: 2, period: 1, periodUnits: 'd' } }
      };
      expect(getProperty(obj, 'Timing:foo')).toEqual('<timing>');
    });

    it('should get a Signature property', () => {
      const obj: TestObject = {
        foo: {
          type: [
            {
              system: 'http://hl7.org/fhir/valueset-signature-type',
              code: '1.2.840.10065.1.12.1.1',
              display: 'AuthorID'
            }
          ],
          when: '2001-01-01T10:30:00.0-05:00',
          whoUri: 'urn:oid:1.2.3.4.5',
          contentType: 'application/pdf',
          bob: '<signature blob>'
        }
      };
      expect(getProperty(obj, 'Signature:foo')).toEqual('<signature>');
    });
  });

  describe('choices', () => {
    // Note: There's nothing in the code that requires these to be valid FHIR objects
    // so we're using simple objects for testing purposes.

    // First simple data types

    it('should get a string property', () => {
      const obj: TestObject = {
        fooString: 'Caution'
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('Caution');
    });

    it('should get a date property', () => {
      const obj: TestObject = {
        fooDate: '2001-01-01'
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('2001-01-01');
    });

    it('should get a dateTime property', () => {
      const obj: TestObject = {
        fooDateTime: '2001-01-01T00:00:00.0'
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('2001-01-01T00:00:00.0');
    });

    it('should get a time property', () => {
      const obj: TestObject = {
        fooTime: '00:00:00.0'
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('00:00:00.0');
    });

    it('should get a boolean property', () => {
      const obj: TestObject = {
        fooBoolean: false
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('false');
    });

    it('should get an integer property', () => {
      const obj: TestObject = {
        fooInteger: 123
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('123');
    });

    it('should get a decimal property', () => {
      const obj: TestObject = {
        fooDecimal: 1.23
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('1.23');
    });

    // Then complex data types

    it('should get a Coding property', () => {
      const obj: TestObject = {
        fooCoding: { system: 'http://snomed.info/sct', code: '73211009', display: 'Diabetes mellitus (disorder)' }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('Diabetes mellitus (disorder)');
    });

    it('should get a CodeableConcept property', () => {
      const obj: TestObject = {
        fooCodeableConcept: {
          coding: [{ system: 'http://snomed.info/sct', code: '73211009', display: 'Diabetes mellitus (disorder)' }],
          text: 'Diabetes'
        }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('Diabetes');
    });

    it('should get a Quantity property', () => {
      const obj: TestObject = {
        fooQuantity: { value: 4.5, system: 'ttp://unitsofmeasure.org', code: 'a', unit: 'year' }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('4.5 a');
    });

    it('should get a Range property', () => {
      const obj: TestObject = {
        fooRange: {
          low: { value: 2, system: 'ttp://unitsofmeasure.org', code: 'wk' },
          high: { value: 6, system: 'ttp://unitsofmeasure.org', code: 'wk' }
        }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('2 wk - 6 wk');
    });

    it('should get a Ratio property', () => {
      const obj: TestObject = {
        fooRatio: {
          numerator: { value: 120, system: 'ttp://unitsofmeasure.org', code: 'ml' },
          denominator: { value: 4, system: 'ttp://unitsofmeasure.org', code: 'd' }
        }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('120 ml / 4 d');
    });

    it('should get a Period property', () => {
      const obj: TestObject = {
        fooPeriod: {
          start: '2001-01-01',
          end: '2003-05-12'
        }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('2001-01-01 - 2003-05-12');
    });

    it('should get an Identifier property', () => {
      const obj: TestObject = {
        fooIdentifier: { use: 'official', system: 'urn:oid:2.16.840.1.113883.16.4.3.2.5', value: '123' }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('123');
    });

    it('should get a HumanName property', () => {
      const obj: TestObject = {
        fooHumanName: { text: 'Bob Smith', family: ['Smith'], given: ['Robert'] }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('Bob Smith');
    });

    it('should get an Annotation property', () => {
      const obj: TestObject = {
        fooAnnotation: { text: "Don't worry. Everything is fine." }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual("Don't worry. Everything is fine.");
    });

    it('should get an Address property', () => {
      const obj: TestObject = {
        fooAddress: {
          line: ['1050 W Wishard Blvd'],
          city: 'Indianapolis',
          state: 'IN',
          postalCode: '46240',
          country: 'USA'
        }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('Indianapolis, IN, USA');
    });

    it('should get an ContactPoint property', () => {
      const obj: TestObject = {
        fooContactPoint: { system: 'phone', value: '555-555-1212' }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('555-555-1212');
    });

    it('should get a Reference property', () => {
      const obj: TestObject = {
        fooReference: { reference: 'Practitioner/123', display: 'Dr. Jones' }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('Dr. Jones');
    });

    it('should get a SampledData property', () => {
      const obj: TestObject = {
        fooSampledData: {
          origin: { value: 0, system: 'ttp://unitsofmeasure.org', code: 'uV' },
          period: 2,
          factor: 2.5,
          dimensions: 1,
          value: '-4 -13 -18 -18 -18 -17 -16 -16 -16 -16 -16 -17 -18 -18 -18'
        }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('<sampled data>');
    });

    it('should get an Attachment property', () => {
      const obj: TestObject = {
        fooAttachment: { contentType: 'application/pdf', language: 'en', data: '<data-goes-here>', title: 'Sample PDF' }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('<attachment>');
    });

    it('should get a Timing property', () => {
      const obj: TestObject = {
        fooTiming: { repeat: { frequency: 2, period: 1, periodUnits: 'd' } }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('<timing>');
    });

    it('should get a Signature property', () => {
      const obj: TestObject = {
        fooSignature: {
          type: [
            {
              system: 'http://hl7.org/fhir/valueset-signature-type',
              code: '1.2.840.10065.1.12.1.1',
              display: 'AuthorID'
            }
          ],
          when: '2001-01-01T10:30:00.0-05:00',
          whoUri: 'urn:oid:1.2.3.4.5',
          contentType: 'application/pdf',
          bob: '<signature blob>'
        }
      };
      expect(getProperty(obj, 'foo[x]')).toEqual('<signature>');
    });
  });
});
