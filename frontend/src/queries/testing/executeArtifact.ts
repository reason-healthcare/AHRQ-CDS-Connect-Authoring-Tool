import slug from 'slug';
import _ from 'lodash';

import cql from 'cql-execution';
import cqlfhir from 'cql-exec-fhir';

import type { Artifact, DataModel, Parameter } from '../../types/artifact';
import type { ElmFile } from '../../types/query';
import type { FHIRBundle } from '../../types/patient';

interface ExecuteArtifactParams {
  elmFiles: ElmFile[];
  artifact: Artifact;
  params: Parameter[];
  patients: FHIRBundle[];
  vsacApiKey: string;
  codeService: {
    ensureValueSets: (
      valueSets: Array<{ name: string; id: string; version?: string }>,
      apiKey: string
    ) => Promise<void>;
  } & Record<string, unknown>;
  dataModel: DataModel;
}

function convertParameters(params: Parameter[] = []): Record<string, unknown> {
  const paramsObj: Record<string, unknown> = {};
  params.forEach(p => {
    // Handle the null case first so we don't have to guard against it later
    if (p.value == null) {
      paramsObj[p.name] = null;
      return;
    }
    switch (p.type) {
      case 'boolean':
        paramsObj[p.name] = p.value === 'true';
        break;
      case 'datetime': {
        const value = p.value as { str?: string };
        paramsObj[p.name] = cql.DateTime.parse(value.str?.slice(1) || '');
        break;
      }
      case 'decimal': {
        const value = p.value as { decimal?: string };
        paramsObj[p.name] = parseFloat(value.decimal || '0');
        break;
      }
      case 'integer':
        paramsObj[p.name] = parseInt(String(p.value), 10);
        break;
      case 'interval_of_datetime': {
        const value = p.value as {
          firstDate?: string;
          firstTime?: string;
          secondDate?: string;
          secondTime?: string;
        };
        let d1: typeof cql.DateTime.prototype | null = null;
        let d2: typeof cql.DateTime.prototype | null = null;
        if (value.firstDate) {
          const str = value.firstTime ? `${value.firstDate}T${value.firstTime}` : value.firstDate;
          d1 = cql.DateTime.parse(str);
        }
        if (value.secondDate) {
          const str = value.secondTime ? `${value.secondDate}T${value.secondTime}` : value.secondDate;
          d2 = cql.DateTime.parse(str);
        }
        paramsObj[p.name] = new cql.Interval(d1, d2);
        break;
      }
      case 'interval_of_decimal': {
        const value = p.value as { firstDecimal?: string; secondDecimal?: string };
        paramsObj[p.name] = new cql.Interval(
          parseFloat(value.firstDecimal || '0'),
          parseFloat(value.secondDecimal || '0')
        );
        break;
      }
      case 'interval_of_integer': {
        const value = p.value as { firstInteger?: string; secondInteger?: string };
        paramsObj[p.name] = new cql.Interval(
          parseInt(value.firstInteger || '0', 10),
          parseInt(value.secondInteger || '0', 10)
        );
        break;
      }
      case 'interval_of_quantity': {
        const value = p.value as { firstQuantity?: number; secondQuantity?: number; unit?: string };
        const q1 = value.firstQuantity != null ? new cql.Quantity(value.firstQuantity, value.unit) : null;
        const q2 = value.secondQuantity != null ? new cql.Quantity(value.secondQuantity, value.unit) : null;
        paramsObj[p.name] = new cql.Interval(q1, q2);
        break;
      }
      case 'string':
        // Remove the leading and trailing single-quotes
        paramsObj[p.name] = String(p.value).replace(/^'(.*)'$/, '$1');
        break;
      case 'system_code': {
        const value = p.value as { code?: string; uri?: string };
        paramsObj[p.name] = new cql.Code(value.code || '', value.uri);
        break;
      }
      case 'system_concept': {
        const value = p.value as { code?: string; uri?: string };
        paramsObj[p.name] = new cql.Concept([new cql.Code(value.code || '', value.uri)]);
        break;
      }
      case 'system_quantity': {
        const value = p.value as { quantity?: number; unit?: string };
        paramsObj[p.name] = new cql.Quantity(value.quantity || 0, value.unit);
        break;
      }
      case 'time': {
        const value = p.value as { str?: string };
        // CQL exec doesn't expose a Time class, so we must construct a DT and then get the Time
        paramsObj[p.name] = cql.DateTime.parse(`0000-01-01${value.str?.slice(1) || ''}`).getTime();
        break;
      }
      default: // do nothing
    }
  });
  return paramsObj;
}

const executeArtifact = async ({
  elmFiles,
  artifact,
  params,
  patients,
  vsacApiKey,
  codeService,
  dataModel
}: ExecuteArtifactParams): Promise<unknown> => {
  const artifactName = `${slug(artifact.name ? artifact.name : 'untitled', { lower: false })}`;

  // Set up the library
  const elmFile = JSON.parse(
    _.find(elmFiles, f => f.name.replace(/[\s-\\/]/g, '') === artifactName.replace(/[\s-\\/]/g, ''))?.content || '{}'
  );
  const libraries = _.filter(
    elmFiles,
    f => f.name.replace(/[\s-\\/]/g, '') !== artifactName.replace(/[\s-\\/]/g, '')
  ).map(f => JSON.parse(f.content));
  const library = new cql.Library(elmFile, new cql.Repository(libraries));
  // Set up the parameters
  const cqlExecParams = convertParameters(params);

  // Create the patient source
  let patientSource: cqlfhir.PatientSource;
  if (dataModel.version === '1.0.2') {
    patientSource = cqlfhir.PatientSource.FHIRv102();
  } else if (dataModel.version === '3.0.0') {
    patientSource = cqlfhir.PatientSource.FHIRv300();
  } else if (dataModel.version === '4.0.0') {
    patientSource = cqlfhir.PatientSource.FHIRv400();
  } else {
    patientSource = cqlfhir.PatientSource.FHIRv401();
  }

  // Load the patient source with the patient
  patientSource.loadBundles(patients);

  // Ensure value sets, downloading any missing value sets
  const valueSets = (elmFile.library?.valueSets?.def || []).map(
    (vs: { name?: string; id?: string; version?: string }) => ({
      name: vs.name || '',
      id: vs.id || '',
      version: vs.version
    })
  );
  await codeService.ensureValueSets(valueSets, vsacApiKey);

  // Value sets are loaded, so execute!
  const executor = new cql.Executor(library, codeService as never, cqlExecParams);
  return executor.exec(patientSource);
};

export default executeArtifact;
