import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import _ from 'lodash';
import config from '../config.js';
import fhir4 from 'fhir/r4';

const VSAC_FHIR_ENDPOINT = config.get('terminologyService') as string;

/**
 * Gets the value set for the given oid,
 *
 * @param {string} oid - the VSAC oid you are after
 * @param {string} username the VSAC user to authenticate as
 * @param {string} password the VSAC user's password
 * @returns {Promise<object>} an object containing the FHIR response for the OID
 */

const codeLookups: Record<string, string> = {
  'http://snomed.info/sct': 'SNOMEDCT',
  'http://hl7.org/fhir/sid/icd-9-cm': 'ICD9CM',
  'http://hl7.org/fhir/sid/icd-10': 'ICD10',
  'http://hl7.org/fhir/sid/icd-10-cm': 'ICD10CM',
  'http://ncimeta.nci.nih.gov': 'NCI',
  'http://loinc.org': 'LOINC',
  'http://www.nlm.nih.gov/research/umls/rxnorm': 'RXNORM',
  'http://unitsofmeasure.org': 'UCUM',
  'http://www.ama-assn.org/go/cpt': 'CPT',
  'http://hl7.org/fhir/sid/cvx': 'CVX'
};

/**
 * In Summer 2022, the VSAC FHIR API started appending "|{version}" to the end
 * of resource ids in search results. This is not actually a valid FHIR id, and
 * it causes problems because other parts of the VSAC API don't accept it as an
 * id. Since we prefer non-version-specific value sets anyway, this function
 * strips the version suffix from the id.
 * @param {string} id - the value set id
 * @returns {string} the id with invalid suffix removed (if applicable)
 */
function stripBarFromId(id: string | undefined): string {
  if (id && id.indexOf('|') !== -1) {
    return id.slice(0, id.indexOf('|'));
  } else {
    return id || '';
  }
}

/**
 * In Winter 2023, the VSAC FHIR API started appending "-{version}" to the end
 * of resource ids in search results. This is not actually valid behavior for a
 * FHIR RESTful service to respond to a search for a resource with an id with a
 * resource that has a different id. This was discussed on chat.fhir.org here:
 * https://chat.fhir.org/#narrow/stream/179202-terminology/topic/VSAC.20Appending.20Version.20to.20ID
 * Since we prefer non-version-specific value sets anyway, this function
 * strips the version suffix from the id.
 * @param {string} id - the value set id
 * @returns {string} the id with invalid suffix removed (if possible)
 */
function stripDashFromId(id: string | undefined, version: string | undefined): string {
  if (id && version && id.endsWith(`-${version}`)) {
    return id.slice(0, id.lastIndexOf(`-${version}`));
  }
  return id || '';
}

function cleanId(id: string | undefined, version: string | undefined): string {
  return stripDashFromId(stripBarFromId(id), version);
}

export interface ParsedPurpose {
  clinicalFocus?: string;
  dataElementScope?: string;
  inclusionCriteria?: string;
  exclusionCriteria?: string;
  purpose?: string;
}

/**
 * Value Sets returned from VSAC contain a purpose element in the format:
 * "(Clinical Focus: ),(Data Element Scope: ),(Inclusion Criteria: ),(Exclusion Criteria: )"
 * If none of the fields contain meaningful text, return null.
 * Otherwise, return an object with each of the descriptions.
 * If the purpose string doesn't match the format, just return it as is.
 * If no purpose is provided, return null
 */
function parsePurpose(purpose: string | undefined | null): ParsedPurpose | null {
  // purpose is 0..1 so it is not guaranteed to be included
  if (purpose == null) {
    return null;
  }

  const vsacPurposeFormat =
    /\(Clinical Focus: (.*)\),\(Data Element Scope: (.*)\),\(Inclusion Criteria: (.*)\),\(Exclusion Criteria: (.*)\)/s;
  const purposeMatch = purpose.match(vsacPurposeFormat);
  if (purposeMatch) {
    const clinicalFocus = purposeMatch[1].trim();
    const dataElementScope = purposeMatch[2].trim();
    const inclusionCriteria = purposeMatch[3].trim();
    const exclusionCriteria = purposeMatch[4].trim();

    // the "empty" purpose returned from VSAC has 4 basic fields included with nothing specified for all 4
    if (clinicalFocus == '' && dataElementScope == '' && inclusionCriteria == '' && exclusionCriteria == '') {
      return null;
    }

    // return the values for each of the items
    return {
      clinicalFocus,
      dataElementScope,
      inclusionCriteria,
      exclusionCriteria
    };
  }

  // Purpose is specified but it doesn't match the above format. Return it without manipulating it.
  return { purpose };
}

export interface ValueSetResult {
  oid: string;
  version: string | undefined;
  displayName: string | undefined;
  codes: Array<{
    code: string | undefined;
    codeSystemURI: string | undefined;
    codeSystemName: string;
    codeSystemVersion: string | undefined;
    displayName: string | undefined;
  }>;
}

async function getValueSet(oid: string, username: string, password: string): Promise<ValueSetResult> {
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: `${VSAC_FHIR_ENDPOINT}/ValueSet/${oid}/$expand`,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
  };

  const res: AxiosResponse<fhir4.ValueSet> = await axios(options);
  const response = res.data;
  return {
    oid: cleanId(response.id, response.version),
    version: response.meta?.versionId,
    displayName: response.title || response.name,
    codes: (response.expansion?.contains || []).map(c => {
      return {
        code: c.code,
        codeSystemURI: c.system,
        codeSystemName: codeLookups[c.system || ''] || c.system || '',
        codeSystemVersion: c.version,
        displayName: c.display
      };
    })
  };
}

// In 2023 the VSAC FHIR API stopped returning the count for the number of codes in each value set as part of
// the results for value set searches, and to fill this gap NLM suggested performing additional queries to
// access the code counts. This function queries the API for the number of codes in a value set given the OID
// for the value set.
async function getValueSetCodeCount(username: string, password: string, oid: string): Promise<number> {
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: `${VSAC_FHIR_ENDPOINT}/ValueSet/${oid}/$expand?count=1`,
    timeout: 3500, // There are lots of these requests, and any one hanging can hold things up, so use a timeout
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
  };
  // Because this is only used to get a count, we don't need to care about any errors. Just catch and ignore.
  // This avoids 500 errors being thrown in the browser console and appearing in the modal when searching.
  const result = await axios(options).catch(() => undefined);
  const count = (result?.data as fhir4.ValueSet | undefined)?.expansion?.total || 0;
  return count;
}

export interface ValueSetSearchResult {
  name: string | undefined;
  steward: string | undefined;
  oid: string;
  description: string;
  experimental: boolean | undefined;
  date: string | undefined;
  lastReviewDate: string;
  purpose: ParsedPurpose | null;
  status: string | undefined;
  codeSystem: Array<unknown>;
  codeCount: number;
}

export interface ValueSetSearchResponse {
  total: number | undefined;
  count: number;
  page: number;
  results: Array<ValueSetSearchResult>;
}

async function searchForValueSets(search: string, username: string, password: string): Promise<ValueSetSearchResponse> {
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: `${VSAC_FHIR_ENDPOINT}/ValueSet?title:contains=${search}&_sort=-date`,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
  };

  const res: AxiosResponse<fhir4.Bundle> = await axios(options);
  const response = res.data;
  const results = (response.entry || []).map(async (v): Promise<ValueSetSearchResult> => {
    const valueSet = v.resource as fhir4.ValueSet;
    const oid = cleanId(valueSet.id, valueSet.version);
    return {
      name: valueSet.title || valueSet.name,
      steward: valueSet.publisher,
      oid,
      description: valueSet.description || '',
      experimental: valueSet.experimental,
      date: valueSet.date,
      lastReviewDate:
        valueSet.extension?.find(e => e.url === 'http://hl7.org/fhir/StructureDefinition/resource-lastReviewDate')
          ?.valueDate || '',
      purpose: parsePurpose(valueSet.purpose),
      status: valueSet.status,
      codeSystem: [],
      // The code counts are not currently returned in the response from the original request, so if we don't
      // see a code count send a separate request to get the counts for this value set; this results in 1+n
      // requests but appears to be sufficiently performant to be worthwhile
      codeCount: valueSet?.expansion?.total || (await getValueSetCodeCount(username, password, oid))
    };
  });
  // Wait for all the results from the code count requests to resolve
  const resolvedResults = await Promise.all(results);
  return {
    total: response.total,
    count: resolvedResults.length,
    page: 1,
    results: resolvedResults
  };
}

export interface CodeResult {
  system: string;
  systemName: string | undefined;
  systemOID: string | undefined;
  version: string | undefined;
  code: string;
  display: string | undefined;
}

async function getCode(code: string, system: string, username: string, password: string): Promise<CodeResult> {
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: `${VSAC_FHIR_ENDPOINT}/CodeSystem/$lookup?code=${code}&system=${system}`,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
  };

  const res: AxiosResponse<fhir4.Parameters> = await axios(options);
  const codeJSON = res.data.parameter || [];
  const codeObject = _.zipObject(
    _.map(codeJSON, 'name'),
    _.map(codeJSON, p => (p as { valueString?: string }).valueString)
  );
  return {
    system,
    systemName: codeObject.name as string | undefined,
    systemOID: codeObject.Oid as string | undefined,
    version: codeObject.version as string | undefined,
    code,
    display: codeObject.display as string | undefined
  };
}

async function getOneValueSet(username: string, password: string): Promise<fhir4.ValueSet> {
  const oneCodeVSOID = '2.16.840.1.113762.1.4.1';
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: `${VSAC_FHIR_ENDPOINT}/ValueSet/${oneCodeVSOID}`,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
  };

  const res: AxiosResponse<fhir4.ValueSet> = await axios(options);
  return res.data;
}

export default {
  getValueSet,
  searchForValueSets,
  getCode,
  getOneValueSet
};
