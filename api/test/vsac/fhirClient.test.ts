import lodash from 'lodash';
import nock from 'nock';

import client from '../../src/vsac/FHIRClient.js';
import * as FHIRMocks from './fixtures/FHIRfixtures.js';
import { importChaiExpect } from '../utils.js';

describe('FHIRClient', () => {
  let expect: typeof import('chai').expect;

  // Helper function for testing promises that are expected to return an error
  const shouldThrowError = (result: Promise<unknown>, errorCode: number): Promise<void> => {
    const errorMessage = `expected a response with status ${errorCode}`;
    return result
      .then(() => {
        throw new Error(errorMessage);
      })
      .catch((err: { message?: string; response?: { status?: number } }) => {
        if (err.message === errorMessage) {
          throw err;
        }
        expect(err.response?.status).to.equal(errorCode);
      });
  };

  // before the tests, disable network connections to ensure tests never hit real network
  before(async () => {
    // if another test suite de-activated nock, we need to re-activate it
    if (!nock.isActive()) nock.activate();
    nock.disableNetConnect();
    expect = await importChaiExpect();
  });

  // after the tests, re-enable network connections
  after(() => {
    nock.restore();
    nock.enableNetConnect();
  });

  // after each test, check and clean nock
  afterEach(() => {
    nock.isDone();
    nock.cleanAll();
  });

  describe('#getValueSet', () => {
    it('should get a value set by OID', () => {
      const [username, password] = ['test-user', 'test-pass'];

      nock('https://cts.nlm.nih.gov').get('/fhir/ValueSet/1234/$expand').reply(200, FHIRMocks.ValueSet);

      // Invoke the request and verify the result
      const result = client.getValueSet('1234', username, password);
      return result.then(res =>
        expect(res).to.eql({
          oid: '1234',
          version: '1',
          displayName: 'foo',
          codes: [
            {
              code: '250.00',
              codeSystemName: 'ICD9CM',
              codeSystemURI: 'http://hl7.org/fhir/sid/icd-9-cm',
              codeSystemVersion: '2013',
              displayName:
                'Diabetes mellitus without mention of complication, type II or unspecified type, ' +
                'not stated as uncontrolled'
            }
          ]
        })
      );
    });

    it('should get a value set by OID and strip |{version}', () => {
      const [username, password] = ['test-user', 'test-pass'];

      const vsWithVersion = lodash.cloneDeep(FHIRMocks.ValueSet) as typeof FHIRMocks.ValueSet & { id?: string };
      vsWithVersion.id = '2468|13579';

      nock('https://cts.nlm.nih.gov').get('/fhir/ValueSet/2468/$expand').reply(200, vsWithVersion);

      // Invoke the request and verify the result
      const result = client.getValueSet('2468|13579', username, password);
      return result.then(res => {
        expect(res.oid).to.equal('2468');
        expect(res.version).to.equal('13579');
      });
    });

    it('should throw an error if the value set is not found', () => {
      const [username, password] = ['test-user', 'test-pass'];

      nock('https://cts.nlm.nih.gov').get('/fhir/ValueSet/9999/$expand').reply(404);

      const result = client.getValueSet('9999', username, password);
      return shouldThrowError(result, 404);
    });

    it('should throw an error if authentication fails', () => {
      const [username, password] = ['bad-user', 'bad-pass'];

      nock('https://cts.nlm.nih.gov').get('/fhir/ValueSet/1234/$expand').reply(401);

      const result = client.getValueSet('1234', username, password);
      return shouldThrowError(result, 401);
    });
  });

  describe('#getValueSetCodeCount', () => {
    it('should get the code count for a value set', () => {
      const [username, password] = ['test-user', 'test-pass'];

      // The function now uses params instead of query string in URL for better nock compatibility
      // Standalone test confirms this works with query(true)
      nock('https://cts.nlm.nih.gov').get('/fhir/ValueSet/1234/$expand').query(true).reply(200, FHIRMocks.ValueSet);

      return client.getValueSetCodeCount('1234', username, password).then(count => {
        expect(count).to.equal(1);
      });
    });
  });

  describe('#searchForValueSets', () => {
    it('should search for value sets', () => {
      const [username, password] = ['test-user', 'test-pass'];

      nock('https://cts.nlm.nih.gov')
        .get('/fhir/ValueSet')
        .query({ 'title:contains': 'test', _sort: '-date' })
        .reply(200, FHIRMocks.Search);

      const result = client.searchForValueSets('test', username, password);
      return result.then(response => {
        expect(response.total).to.be.a('number');
        expect(response.results).to.be.an('array');
      });
    });
  });

  describe('#getCode', () => {
    it('should get a code by code system and code', () => {
      const [username, password] = ['test-user', 'test-pass'];

      const codeMock = {
        resourceType: 'Parameters',
        parameter: [
          { name: 'name', valueString: 'ICD9CM' },
          { name: 'version', valueString: '2013' },
          { name: 'display', valueString: 'Test code display' },
          { name: 'Oid', valueString: '2.16.840.1.113883.6.103' }
        ]
      };

      nock('https://cts.nlm.nih.gov')
        .get('/fhir/CodeSystem/$lookup')
        .query(true) // Match any query parameters
        .reply(200, codeMock);

      const result = client.getCode('250.00', 'ICD9CM', username, password);
      return result.then(res => {
        expect(res.code).to.equal('250.00');
        expect(res.systemName).to.equal('ICD9CM');
      });
    });
  });
});
