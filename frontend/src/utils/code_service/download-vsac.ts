import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { Code, ValueSet } from 'cql-execution';
import extractOid from './extractOid';

const API_BASE = process.env.REACT_APP_API_URL;

interface ValueSetReference {
  name: string;
  id: string;
  version?: string;
}

interface ValueSetDatabase {
  [oid: string]: {
    [version: string]: ValueSet;
  };
}

interface VSACCode {
  code: string;
  codeSystemURI: string;
  codeSystemVersion?: string;
  displayName?: string;
}

interface VSACValueSetResponse {
  oid: string;
  version: string;
  codes: VSACCode[];
}

function downloadFromVSAC(apiKey: string, input: ValueSetReference[], vsDB: ValueSetDatabase = {}): Promise<void> {
  const vsJSON: Record<string, string> = {};
  const keys = Object.keys(input);
  keys.forEach((val, idx) => {
    if (!(input[idx].id in vsDB)) {
      vsJSON[input[idx].name] = input[idx].id;
    }
  });
  if (Object.keys(vsJSON).length > 0) {
    const oids = Object.keys(vsJSON).map(k => extractOid(vsJSON[k]));
    const promises = oids.map(oid =>
      // Catch errors and convert to resolutions returning an error.  This ensures Promise.all waits for all promises.
      // See: http://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises
      getVSDetailsByOIDFHIR(oid[0], apiKey, vsDB).catch(err => err)
    );
    return Promise.all(promises).then(results => {
      // eslint-disable-line consistent-return
      const errors = results.filter(r => r instanceof Error);
      if (errors.length > 0) {
        return Promise.reject(errors[0]);
      }
    });
  }
  return Promise.resolve();
}

function getVSDetailsByOIDFHIR(oid: string, apiKey: string, vsDB: ValueSetDatabase): Promise<VSACValueSetResponse> {
  const auth: AxiosRequestConfig['auth'] = {
    username: '',
    password: apiKey
  };

  return new Promise((resolve, reject) => {
    axios
      .get<VSACValueSetResponse>(`${API_BASE}/fhir/vs/${oid}`, { auth })
      .then(result => {
        const codes: Code[] = [];
        result.data.codes.forEach(code => {
          codes.push(new Code(code.code, code.codeSystemURI, code.codeSystemVersion, code.displayName));
        });
        const vsOID = result.data.oid;
        const vsVersion = result.data.version;
        vsDB[vsOID] = {};
        vsDB[vsOID][vsVersion] = new ValueSet(vsOID, vsVersion, codes);
        resolve(result.data);
      })
      .catch(error => reject(error));
  });
}

export default downloadFromVSAC;
