import downloadFromVSAC from './download-vsac';
import extractOid from './extractOid';
import { ValueSet } from 'cql-execution';

interface ValueSetReference {
  name: string;
  id: string;
  version?: string;
}

/**
 * Constructs a code service with functions for downloading codes from the National Library of Medicine's
 * Value Set Authority Center.
 */
class CodeService {
  valueSets: Record<string, Record<string, ValueSet>>;

  constructor() {
    this.valueSets = {}; // This will just be an object of objects.
  }

  /**
   * Given a list of value set references, will ensure that each has a local
   * definition.  If a local definition does not exist, the value set will
   * be downloaded using the VSAC API.
   * @param valueSetList - an array of objects, each containing "name"
   *   and "id" properties, with an optional "version" property
   * @param vsacApiKey - the VSAC API key
   * @returns A promise that returns nothing when
   *   resolved and returns an error when rejected.
   */
  ensureValueSets(valueSetList: ValueSetReference[] = [], vsacApiKey: string): Promise<void> {
    // First, filter out the value sets we already have
    const filteredVSList = valueSetList.filter(vs => {
      const result = this.findValueSet(vs.id, vs.version);
      return typeof result === 'undefined';
    });
    // Now download from VSAC if necessary
    if (filteredVSList.length === 0) {
      return Promise.resolve();
    } else if (!vsacApiKey) {
      return Promise.reject(new Error('Failed to download value sets since API Key is not provided.'));
    }
    return downloadFromVSAC(vsacApiKey, filteredVSList, this.valueSets);
  }

  findValueSetsByOid(oid: string): ValueSet[] {
    const result: ValueSet[] = [];
    const vs = this.valueSets[oid];
    if (!vs) return result;
    let version: string;

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (version in vs) {
      result.push(vs[version]);
    }
    return result;
  }

  findValueSet(id: string, version?: string): ValueSet | undefined {
    const oidArray = extractOid(id);
    const oid = oidArray[0];
    if (version != null) {
      const vsObj = this.valueSets[oid];
      if (typeof vsObj !== 'undefined') {
        return vsObj[version];
      }
    } else {
      const results = this.findValueSetsByOid(oid);
      if (results.length !== 0) {
        return results.reduce((a, b) => {
          if (a.version > b.version) {
            return a;
          }
          return b;
        });
      }
    }
    return undefined;
  }
}

export default CodeService;
