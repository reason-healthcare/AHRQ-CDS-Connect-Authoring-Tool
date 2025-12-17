import { Response } from 'express';
import _ from 'lodash';
// @ts-ignore - unzipper doesn't have type definitions
import unzipper from 'unzipper';
import CQLLibrary from '../models/cqlLibrary.js';
import Artifact from '../models/artifact.js';
import * as cqlHandler from '../handlers/cqlHandler.js';
import { AuthenticatedRequest, sendUnauthorized } from './common.js';
import type { ArtifactElement, ArtifactStructure } from '../types/artifact.js';

const supportedFHIRVersions: string[] = ['1.0.2', '3.0.0', '4.0.0', '4.0.1'];

const authoringToolExports: Array<{ name: string; version: string }> = [
  { name: 'FHIRHelpers', version: '1.0.2' },
  { name: 'FHIRHelpers', version: '3.0.0' },
  { name: 'FHIRHelpers', version: '4.0.0' },
  { name: 'FHIRHelpers', version: '4.0.1' }
];

const singularTypeMap: Record<string, string> = {
  Boolean: 'boolean',
  Code: 'system_code',
  Concept: 'system_concept',
  Integer: 'integer',
  DateTime: 'datetime',
  Decimal: 'decimal',
  Quantity: 'system_quantity',
  String: 'string',
  Time: 'time',
  Observation: 'observation',
  Condition: 'condition',
  MedicationStatement: 'medication_statement',
  MedicationOrder: 'medication_request',
  MedicationRequest: 'medication_request',
  Procedure: 'procedure',
  AllergyIntolerance: 'allergy_intolerance',
  ServiceRequest: 'service_request',
  Encounter: 'encounter',
  Immunization: 'immunization',
  Device: 'device',
  Any: 'any'
};

const listTypeMap: Record<string, string> = {
  Observation: 'list_of_observations',
  Condition: 'list_of_conditions',
  MedicationStatement: 'list_of_medication_statements',
  MedicationOrder: 'list_of_medication_requests',
  MedicationRequest: 'list_of_medication_requests',
  Procedure: 'list_of_procedures',
  AllergyIntolerance: 'list_of_allergy_intolerances',
  Encounter: 'list_of_encounters',
  Immunization: 'list_of_immunizations',
  Device: 'list_of_devices',
  Any: 'list_of_any',
  Boolean: 'list_of_booleans',
  Code: 'list_of_system_codes',
  Concept: 'list_of_system_concepts',
  Integer: 'list_of_integers',
  DateTime: 'list_of_datetimes',
  Decimal: 'list_of_decimals',
  Quantity: 'list_of_system_quantities',
  String: 'list_of_strings',
  Time: 'list_of_times',
  ServiceRequest: 'list_of_service_requests'
};

const intervalTypeMap: Record<string, string> = {
  Integer: 'interval_of_integer',
  DateTime: 'interval_of_datetime',
  Decimal: 'interval_of_decimal',
  Quantity: 'interval_of_quantity'
};

const getTypeFromELMString = (string: string): { elmType: string; isValidType: boolean } => {
  const namespace = string.split('}')[0].substring(1);
  const elmType = string.substring(string.indexOf('}') + 1);
  const typesFromFHIR = [
    'Observation',
    'Condition',
    'MedicationStatement',
    'MedicationOrder',
    'MedicationRequest',
    'Procedure',
    'AllergyIntolerance',
    'Encounter',
    'Immunization',
    'Device',
    'ServiceRequest'
  ];
  const isSystem = namespace === 'urn:hl7-org:elm-types:r1';
  const isFHIR = namespace === 'http://hl7.org/fhir';
  const isValidType = isSystem || (isFHIR && typesFromFHIR.includes(elmType));
  return { elmType, isValidType };
};

const areChoicesKnownTypes = (
  choices: Array<{ type: string; name?: string }>
): { allChoicesKnown: boolean; typesOfChoices: string[] } => {
  let allChoicesKnown = true;
  const typesOfChoices: string[] = [];
  choices.forEach(choice => {
    if (choice.type === 'NamedTypeSpecifier') {
      const { elmType, isValidType } = getTypeFromELMString(choice.name || '');
      const convertedType = isValidType ? singularTypeMap[elmType] : null;
      if (!convertedType) {
        allChoicesKnown = false;
      }
      let typeToDisplay = convertedType ? convertedType : elmType;
      if (elmType === 'MedicationRequest') typeToDisplay = 'Medication Request';
      if (elmType === 'MedicationOrder') typeToDisplay = 'Medication Order';
      typesOfChoices.push(_.startCase(typeToDisplay));
    } else {
      // Default to marking as unknown.
      allChoicesKnown = false;
      typesOfChoices.push('Unknown');
    }
  });
  return { allChoicesKnown, typesOfChoices };
};

function calculateType(definition: Record<string, unknown>): { elmType: string; elmDisplay?: string } {
  let elmType: string;
  let elmDisplay: string | undefined;
  let isValidType: boolean;

  if (definition.resultTypeName || definition.operandType) {
    ({ elmType, isValidType } = getTypeFromELMString((definition.resultTypeName || definition.operandType) as string));
    const convertedType = isValidType ? singularTypeMap[elmType] : null;
    if (!convertedType) elmDisplay = `Other (${elmType})`;
    if (elmType === 'MedicationRequest') elmDisplay = 'Medication Request';
    if (elmType === 'MedicationOrder') elmDisplay = 'Medication Order';
    elmType = convertedType ? convertedType : 'other';
  } else if (definition.resultTypeSpecifier || definition.operandTypeSpecifier) {
    const typeSpecifier = (definition.resultTypeSpecifier || definition.operandTypeSpecifier) as Record<
      string,
      unknown
    >;
    switch (typeSpecifier.type as string) {
      case 'NamedTypeSpecifier': {
        ({ elmType, isValidType } = getTypeFromELMString(typeSpecifier.name as string));
        const convertedType = isValidType ? singularTypeMap[elmType] : null;
        if (!convertedType) elmDisplay = `Other (${elmType})`;
        if (elmType === 'MedicationRequest') elmDisplay = 'Medication Request';
        if (elmType === 'MedicationOrder') elmDisplay = 'Medication Order';
        elmType = convertedType ? convertedType : 'other';
        break;
      }
      case 'IntervalTypeSpecifier': {
        ({ elmType, isValidType } = getTypeFromELMString((typeSpecifier.pointType as { name: string }).name));
        const convertedType = isValidType ? intervalTypeMap[elmType] : null;
        if (!convertedType) elmDisplay = `Interval of Others (${elmType})`;
        elmType = convertedType ? convertedType : 'interval_of_other';
        break;
      }
      case 'ListTypeSpecifier': {
        const elementType = typeSpecifier.elementType as Record<string, unknown>;
        if (elementType.type === 'ChoiceTypeSpecifier') {
          const { allChoicesKnown, typesOfChoices } = areChoicesKnownTypes(
            (elementType.choice as Array<{ type: string; name?: string }>) || []
          );
          elmType = allChoicesKnown ? 'list_of_any' : 'list_of_others';
          if (!allChoicesKnown) elmDisplay = `List of Others (${typesOfChoices.join(', ')})`;
          else elmDisplay = `List of Any (${typesOfChoices.join(', ')})`;
        } else if (elementType.type === 'TupleTypeSpecifier') {
          elmType = 'list_of_others';
          elmDisplay = 'List of Others (Tuple)';
        } else if (elementType.type === 'NamedTypeSpecifier') {
          ({ elmType, isValidType } = getTypeFromELMString((elementType.name as string) || ''));
          const convertedType = isValidType ? listTypeMap[elmType] : null;
          if (!convertedType) elmDisplay = `List of Others (${elmType})`;
          if (elmType === 'MedicationRequest') elmDisplay = 'List of Medication Requests';
          if (elmType === 'MedicationOrder') elmDisplay = 'List of Medication Orders';
          if (elmType === 'ServiceRequest') elmDisplay = 'List of Service Requests';
          elmType = convertedType ? convertedType : 'list_of_others';
        } else if (elementType.type === 'ListTypeSpecifier') {
          elmType = 'list_of_others';
          elmDisplay = 'List of Lists';
        } else if (elementType.type === 'IntervalTypeSpecifier') {
          elmType = 'list_of_others';
          elmDisplay = 'List of Intervals';
        } else {
          elmType = 'list_of_others';
          elmDisplay = 'List of Others (unknown)';
        }
        break;
      }
      case 'TupleTypeSpecifier': {
        elmType = 'other';
        elmDisplay = 'Other (Tuple)';
        break;
      }
      case 'ChoiceTypeSpecifier': {
        const { allChoicesKnown, typesOfChoices } = areChoicesKnownTypes(
          (typeSpecifier.choice as Array<{ type: string; name?: string }>) || []
        );
        elmType = allChoicesKnown ? 'any' : 'other';
        if (!allChoicesKnown) elmDisplay = `Other (Choice of ${typesOfChoices.join(', ')})`;
        break;
      }
      default: {
        elmType = 'other';
        elmDisplay = 'Other (unknown)';
        break;
      }
    }
  } else {
    elmType = 'other';
    elmDisplay = 'Other (unknown)';
  }

  return { elmType, elmDisplay };
}

function mapTypes(definitions: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const mappedDefinitions = definitions;
  mappedDefinitions.map(definition => {
    const { elmType, elmDisplay } = calculateType(definition);
    definition.calculatedReturnType = elmType || 'other';
    definition.displayReturnType = elmDisplay;

    if (definition.operand && Array.isArray(definition.operand) && definition.operand.length > 0) {
      const argumentTypes: Array<{ calculated: string; display?: string }> = [];
      (definition.operand as Array<Record<string, unknown>>).forEach(operand => {
        const { elmType, elmDisplay } = calculateType(operand);
        argumentTypes.push({ calculated: elmType || 'other', display: elmDisplay });
      });
      definition.argumentTypes = argumentTypes;
      // The inputTypes should only be equivalent to the input type of the first argument
      // so that external CQL modifiers can use the element return type as this input
      const argTypes = definition.argumentTypes as Array<{ calculated: string }> | undefined;
      definition.inputTypes = argTypes && argTypes.length > 0 ? [argTypes[0].calculated] : [];
    }
  });
  return mappedDefinitions;
}

function checkMatch(
  elmResults: { name: string; version: string },
  files: Array<{ text: string }>
): { text: string } | undefined {
  const libraryAndVersionRegex = /library\s+(([A-Za-z_][A-Za-z0-9_]*)|"(.+)")\s+version\s+'(.+)'/m;
  const fileForELMResult = files.find(file => {
    const matches = libraryAndVersionRegex.exec(file.text);
    const isMatch =
      matches &&
      (matches[2] === elmResults.name || matches[3] === elmResults.name) &&
      matches[4] === elmResults.version;
    return isMatch;
  });
  return fileForELMResult;
}

const filterDefinition = (def: Record<string, unknown>): boolean =>
  (def.name as string) !== 'Patient' && (def.accessLevel as string) === 'Public';

const filterCQLFiles = (file: { path: string; type: string }): boolean => {
  const filePathArray = file.path.split('/');
  const fileName = filePathArray[filePathArray.length - 1];
  return file.type === 'File' && file.path.endsWith('.cql') && !fileName.startsWith('.');
};

function getCurrentFHIRVersion(libraries: Array<{ fhirVersion?: string }>): string {
  let currentFHIRVersion = ''; // Empty string means no FHIR version set yet;
  libraries.forEach(lib => {
    if (lib.fhirVersion) currentFHIRVersion = lib.fhirVersion;
  });
  return currentFHIRVersion;
}

const collectLibraryElementsFromElement = (
  element: Record<string, unknown>,
  libraryName: string,
  libraryElements: Array<Record<string, unknown>>,
  modifierElements: Array<Record<string, unknown>>
): void => {
  // Collect external CQL elements associated with this library
  if (element.type === 'externalCqlElement') {
    const fields = (element.fields as Array<{ id: string; value?: Record<string, unknown> }>) || [];
    const referenceField = fields.find((f: { id: string }) => f.id === 'externalCqlReference');
    if (referenceField && _.get(referenceField, 'value.library') === libraryName) libraryElements.push(element);
  }

  // Collect any elements that have external CQL functions associated with this library.
  const modifiers = (element.modifiers as Array<Record<string, unknown>>) || [];
  if (modifiers.length > 0) {
    modifiers.forEach((modifier: Record<string, unknown>) => {
      if (modifier.type === 'ExternalModifier' && modifier.libraryName === libraryName) modifierElements.push(element);
    });
  }
};

const collectLibraryElementsFromTree = (
  element: Record<string, unknown>,
  libraryName: string,
  libraryElements: Array<Record<string, unknown>>,
  modifierElements: Array<Record<string, unknown>>
): Record<string, unknown> => {
  let children = (element.childInstances as Array<Record<string, unknown>>) || [];
  children = children.map((child: Record<string, unknown>) => {
    if (child.childInstances) {
      return collectLibraryElementsFromTree(child, libraryName, libraryElements, modifierElements);
    } else {
      collectLibraryElementsFromElement(child, libraryName, libraryElements, modifierElements);
      return child;
    }
  });
  element.childInstances = children;
  return element;
};

const getExternalLibraryAndModifierElements = (
  artifact: Record<string, unknown>,
  libraryName: string
): { libraryElements: Array<Record<string, unknown>>; modifierElements: Array<Record<string, unknown>> } => {
  const libraryElements: Array<Record<string, unknown>> = [];
  const modifierElements: Array<Record<string, unknown>> = [];
  collectLibraryElementsFromTree(
    artifact.expTreeInclude as Record<string, unknown>,
    libraryName,
    libraryElements,
    modifierElements
  );
  collectLibraryElementsFromTree(
    artifact.expTreeExclude as Record<string, unknown>,
    libraryName,
    libraryElements,
    modifierElements
  );
  ((artifact.subpopulations as Array<Record<string, unknown>>) || []).forEach(
    (subpopulation: Record<string, unknown>) => {
      if (!(subpopulation.special as boolean | undefined)) {
        collectLibraryElementsFromTree(subpopulation, libraryName, libraryElements, modifierElements);
      }
    }
  );
  ((artifact.baseElements as Array<Record<string, unknown>>) || []).forEach((baseElement: Record<string, unknown>) => {
    if (baseElement.childInstances) {
      collectLibraryElementsFromTree(baseElement, libraryName, libraryElements, modifierElements);
    } else {
      collectLibraryElementsFromElement(baseElement, libraryName, libraryElements, modifierElements);
    }
  });
  return { libraryElements, modifierElements };
};

const shouldLibraryBeUpdated = (library: Record<string, unknown>, artifact: Record<string, unknown>): boolean => {
  const statementReturnTypes: Record<string, unknown> = {};
  const elementReturnTypes: Record<string, unknown> = {};
  const statementArgs: Record<string, unknown> = {};
  const elementArgs: Record<string, unknown> = {};
  // In this situation, definitions and parameters behave identically, so they are bucketed together
  const libraryDetails = library.details as {
    definitions?: Array<Record<string, unknown>>;
    parameters?: Array<Record<string, unknown>>;
    functions?: Array<Record<string, unknown>>;
  };
  (libraryDetails.definitions || []).concat(libraryDetails.parameters || []).forEach((def: Record<string, unknown>) => {
    statementReturnTypes[def.name as string] = def.calculatedReturnType;
  });

  // The prefix for functions is added to delineate names from definitions, since both can have the
  // same name legally in CQL
  (libraryDetails.functions || []).forEach((func: Record<string, unknown>) => {
    statementReturnTypes[`func:${func.name}`] = func.calculatedReturnType;
    statementArgs[`func:${func.name}`] = func.operand;
  });

  const { libraryElements, modifierElements } = getExternalLibraryAndModifierElements(artifact, library.name as string);

  // It's possible in the following calculation for elementReturnTypes and elementArgs that some of the fields
  // may be overwritten, but this is okay because all instances that we collect will be identical within the
  // same artifact
  libraryElements.forEach((el: Record<string, unknown>) => {
    const fields = (el.fields as Array<{ id: string; value?: Record<string, unknown> }>) || [];
    const referenceField = fields.find((f: { id: string }) => f.id === 'externalCqlReference');
    if (referenceField && referenceField.value) {
      const referenceFieldValueElement = referenceField.value.element as string;
      if (el.template === 'GenericFunction') {
        elementReturnTypes[`func:${referenceFieldValueElement}`] = el.returnType;
        elementArgs[`func:${referenceFieldValueElement}`] = referenceField.value.arguments;
      } else {
        elementReturnTypes[referenceFieldValueElement] = el.returnType;
      }
    }
  });
  modifierElements.forEach((el: Record<string, unknown>) => {
    ((el.modifiers as Array<Record<string, unknown>>) || []).forEach((mod: Record<string, unknown>) => {
      if (mod.type === 'ExternalModifier') {
        elementReturnTypes[`func:${mod.functionName}`] = mod.returnType;
        elementArgs[`func:${mod.functionName}`] = mod.arguments;
      }
    });
  });

  // If a library to update has contents whose names, return types, or args have changed, and the
  // artifact is using these contents, we cannot update it and we shouldn't make any upload/update
  let returnTypesMatch = true;
  let argsMatch = true;
  const deleteNestedMetadataProps = (obj: Record<string, unknown>): Record<string, unknown> => {
    for (const prop in obj) {
      // These fields are not useful for comparison and can cause false differences between
      // data since they are only for metadata
      if (['annotation', 'localId', 'locator'].includes(prop)) {
        delete obj[prop];
      } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        deleteNestedMetadataProps(obj[prop] as Record<string, unknown>);
      }
    }
    return obj;
  };

  Object.keys(elementReturnTypes).forEach((key: string) => {
    returnTypesMatch = returnTypesMatch && statementReturnTypes[key] === elementReturnTypes[key];
    const statementArgsToMatch = deleteNestedMetadataProps(_.cloneDeep(statementArgs[key]) as Record<string, unknown>);
    const elementArgsToMatch = deleteNestedMetadataProps(_.cloneDeep(elementArgs[key]) as Record<string, unknown>);
    argsMatch = argsMatch && _.isEqual(statementArgsToMatch, elementArgsToMatch);
  });

  return returnTypesMatch && argsMatch;
};

// Get all libraries for a given artifact
async function allGet(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    try {
      const libraries = await CQLLibrary.find({ user: req.user.uid, linkedArtifactId: req.params.artifactId }).exec();
      res.json(libraries);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

// Get a single external CQL library
async function singleGet(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const { id } = req.params;
    try {
      const library = await CQLLibrary.find({ user: req.user.uid, _id: id }).exec();
      library.length === 0 ? res.sendStatus(404) : res.json(library);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

function parseELMFiles(
  elmFiles: Array<{ content: string; name?: string }>,
  artifactId: string,
  userId: string,
  files: Array<{ text: string; filename?: string }>
): { elmErrors: Array<unknown>; elmResultsToSave: Array<Record<string, unknown>>; notFHIR: boolean } {
  const elmResultsToSave: Array<Record<string, unknown>> = [];
  let elmErrors: Array<Record<string, unknown>> = [];
  let notFHIR = false;
  for (const file of elmFiles) {
    let elmResults: Record<string, unknown> = {
      linkedArtifactId: artifactId,
      user: userId
    };
    const parsedContent = JSON.parse(file.content) as Record<string, unknown>;
    const annotations = (_.get(parsedContent, 'library.annotation', []) as Array<Record<string, unknown>>) || [];
    elmErrors = elmErrors.concat(annotations.filter((a: Record<string, unknown>) => a.errorSeverity === 'error'));

    const library = parsedContent.library as Record<string, unknown>;
    const identifier = (library.identifier as { id?: string; version?: string }) || {};
    elmResults.name = identifier.id || '';
    elmResults.version = identifier.version || '';

    const fileForELMResult = checkMatch(elmResults as { name: string; version: string }, files);

    // Make sure there is no data model that isn't default System or FHIR.
    // If there is, we can break since none of this will be uploaded.
    const elmDefs = (_.get(library, 'usings.def', []) as Array<Record<string, unknown>>) || [];
    notFHIR = elmDefs.some(
      (def: Record<string, unknown>) => !['System', 'FHIR'].includes(def.localIdentifier as string)
    );
    if (notFHIR) break;

    // Find FHIR version used by library
    const fhirDef = _.find(elmDefs, { localIdentifier: 'FHIR' }) as { version?: string } | undefined;
    elmResults.fhirVersion = fhirDef?.version || '';

    const details: Record<string, unknown> = {};
    details.cqlFileText = fileForELMResult ? fileForELMResult.text : '';
    const fileForELMResultWithFilename = fileForELMResult as { text: string; filename?: string } | undefined;
    details.fileName = fileForELMResultWithFilename ? fileForELMResultWithFilename.filename || '' : '';
    let elmParameters = ((_.get(library, 'parameters.def', []) as Array<Record<string, unknown>>) || []).filter(
      filterDefinition
    );
    let elmDefinitions = ((_.get(library, 'statements.def', []) as Array<Record<string, unknown>>) || []).filter(
      filterDefinition
    );
    const allowedAttributes = [
      'accessLevel',
      'name',
      'type',
      'context',
      'resultTypeName',
      'resultTypeSpecifier',
      'operand'
    ];
    elmParameters = elmParameters.map((def: Record<string, unknown>) => {
      return _.pick(def, allowedAttributes);
    });
    elmDefinitions = elmDefinitions.map((def: Record<string, unknown>) => {
      return _.pick(def, allowedAttributes);
    });
    const defineStatements = elmDefinitions.filter((def: Record<string, unknown>) => def.type !== 'FunctionDef');
    const functionStatements = elmDefinitions.filter((def: Record<string, unknown>) => def.type === 'FunctionDef');
    details.parameters = mapTypes(elmParameters);
    details.definitions = mapTypes(defineStatements);
    details.functions = mapTypes(functionStatements);
    const fileDependencies = (_.get(library, 'includes.def', []) as Array<unknown>) || [];
    details.dependencies = fileDependencies;
    elmResults.details = details;
    elmResultsToSave.push(elmResults);
  }

  return { elmErrors, elmResultsToSave, notFHIR };
}

function doesUploadedLibraryMatchArtifactName(libraryName: string, artifactName: string): boolean {
  //the artifact may have spaces, which will be replace by a '-' upon export
  //therefore we will compare the uploaded library with a modified artifact name
  let tmpArtifactName = artifactName.replace(/\s/g, '-');
  //localeCompare returns 0 if they are equivalent.  the sensitivity option ignores characters with accents
  //https://stackoverflow.com/questions/2140627/how-to-do-case-insensitive-string-comparison
  return libraryName.localeCompare(tmpArtifactName, undefined, { sensitivity: 'accent' }) === 0;
}

// Post a single external CQL library
function singlePost(req: AuthenticatedRequest, res: Response): void {
  if (req.user) {
    const { cqlFileName, cqlFileContent, fileType, artifact } = req.body.library;
    const artifactId = artifact._id;
    let artifactFHIRVersion = artifact.fhirVersion;

    let duplicateLib = { flag: false, libraryName: '' };
    const decodedBuffer = Buffer.from(cqlFileContent, 'base64');

    if (fileType === 'application/zip') {
      unzipper.Open.buffer(decodedBuffer)
        .then(async (directory: { files: Array<{ path: string; type: string; buffer: () => Promise<Buffer> }> }) => {
          const files = await Promise.all(
            directory.files
              .filter(filterCQLFiles)
              .map(async (file: { path: string; buffer: () => Promise<Buffer> }) => {
                const buffer = await file.buffer();
                const filePathArray = file.path.split('/');
                const fileName = filePathArray[filePathArray.length - 1];
                return Promise.resolve({ filename: fileName, type: 'text/plain', text: buffer.toString() });
              })
          );
          cqlHandler.makeCQLtoELMRequest(files, [], false, async (err, elmFiles) => {
            if (err) {
              res.status(500).send(err);
              return;
            }

            const { elmErrors, elmResultsToSave, notFHIR } = parseELMFiles(
              (elmFiles as Array<{ content: string; name?: string }>) || [],
              artifactId,
              req.user?.uid || '',
              files
            );

            elmResultsToSave.forEach((elmResult: Record<string, unknown>) => {
              if (doesUploadedLibraryMatchArtifactName(elmResult.name as string, artifact.name as string)) {
                duplicateLib.flag = true;
                duplicateLib.libraryName = elmResult.name as string;
                const details = elmResult.details as { fileName?: string } | undefined;
                (duplicateLib as { fileName?: string }).fileName = details?.fileName || '';
              }
            });

            if (duplicateLib.flag) {
              res
                .status(400)
                .send(
                  `Unable to upload external CQL because the library '${duplicateLib.libraryName}' in the file ` +
                    `'${(duplicateLib as { fileName?: string }).fileName || ''}' shares the same name as the artifact itself. To fix this, either ` +
                    'rename this artifact in the CDS Authoring Tool or rename the external CQL library and try again.'
                );
              return;
            }

            if (notFHIR) {
              res
                .status(400)
                .send(
                  'Unable to upload external CQL because at least one library uses a data model that is not FHIR®. ' +
                    'The CDS Authoring Tool only supports external CQL libraries that use the FHIR® data model.'
                );
              return;
            }

            try {
              const libraries = await CQLLibrary.find({
                user: req.user?.uid || '',
                linkedArtifactId: artifactId
              }).exec();
              const nonAuthoringToolExportLibraries = _.differenceWith(
                elmResultsToSave,
                authoringToolExports,
                (a, b) => a.name === b.name
              );
              const authoringToolExportLibraries = _.difference(elmResultsToSave, nonAuthoringToolExportLibraries);

              const nonDuplicateLibraries = _.differenceWith(
                nonAuthoringToolExportLibraries,
                libraries,
                (a, b) => a.name === b.name && a.version === b.version
              );
              const duplicateLibraries = _.difference(nonAuthoringToolExportLibraries, nonDuplicateLibraries);

              const librariesToInsert = _.differenceWith(
                nonDuplicateLibraries,
                libraries,
                (a, b) => a.name === b.name && a.version !== b.version
              );
              const librariesToUpdate = _.difference(nonDuplicateLibraries, librariesToInsert);

              const newLibFHIRVersion = getCurrentFHIRVersion(elmResultsToSave);
              const fhirVersion = getCurrentFHIRVersion(libraries);
              // If the artifact FHIR version is R4 wildcard, set it to whatever R4 is being used.
              if (artifactFHIRVersion === '4.0.x') {
                if (newLibFHIRVersion && newLibFHIRVersion.startsWith('4.0.')) {
                  artifactFHIRVersion = newLibFHIRVersion;
                } else if (fhirVersion && fhirVersion.startsWith('4.0.')) {
                  artifactFHIRVersion = fhirVersion;
                }
              }

              // If no FHIR version locked, any version can be uploaded.
              // If no FHIR version on any libraries being added, they can be added
              const fhirVersionsMatch = fhirVersion && newLibFHIRVersion ? fhirVersion === newLibFHIRVersion : true;

              // If FHIR Version is locked by the artifact itself, only matching versions can be uploaded.
              // If the version is unlocked by artifact, any artifact can be uploaded.
              const artifactFHIRVersionsMatch =
                newLibFHIRVersion && artifactFHIRVersion ? newLibFHIRVersion === artifactFHIRVersion : true;

              // If new libraries have no FHIR version or it matches a supported FHIR version, we support it
              const supportedFHIRVersion =
                newLibFHIRVersion === '' || supportedFHIRVersions.findIndex(v => v === newLibFHIRVersion) !== -1;

              //If repeats of the same library are being uploaded (regardless of version), we will not support this
              const hasRepeats =
                nonAuthoringToolExportLibraries.length !==
                new Set(nonAuthoringToolExportLibraries.map(l => l.name)).size;
              const exportLibrariesNotUploaded = authoringToolExportLibraries
                .map(lib => `library ${lib.name}`)
                .join(', ');
              const exportLibrariesNotUploadedMessage =
                'The following libraries were not uploaded because the CDS Authoring Tool already includes a ' +
                `version of the same library by default:  ${exportLibrariesNotUploaded}. No further action is ` +
                'necessary.';
              // If any file has an error, upload nothing.
              if (elmErrors.length > 0) {
                res.status(400).send(elmErrors);
              } else if (!fhirVersionsMatch) {
                const message =
                  'Unable to upload external CQL because a library using a different version of FHIR® is already ' +
                  'uploaded. Only one FHIR® version can be supported at a time. To fix this, either remove the ' +
                  'previously uploaded FHIR® libraries or upload new libraries that use the same version of FHIR®.';
                res.status(400).send(message);
              } else if (!artifactFHIRVersionsMatch) {
                const message =
                  'Unable to upload external CQL because it uses a different version of FHIR® than this artifact ' +
                  `requires. To fix this, only upload libraries that use FHIR ${artifactFHIRVersion}.`;
                res.status(400).send(message);
              } else if (!supportedFHIRVersion) {
                res
                  .status(400)
                  .send(
                    'Unable to upload external CQL because it uses an unsupported FHIR® version. The CDS Authoring ' +
                      'Tool currently supports CQL using the following FHIR® versions: 1.0.2, 3.0.0, 4.0.0, or ' +
                      '4.0.1. To fix this, upload a new library that uses one of the supported versions.'
                  );
              } else if (hasRepeats) {
                const message =
                  'Unable to upload external CQL because more than one library in this package has the same name. ' +
                  'Only one library of the same name can be uploaded at a time. To fix this, ensure that you only ' +
                  'upload zip files that contain CQL libraries with unique names.';
                res.status(400).send(message);
              } else {
                // If a library to update has contents whose names or return types have changed, and the
                // artifact is using these contents, we cannot update it and we shouldn't make any upload/update
                let shouldUpdate = true;
                for (const library of librariesToUpdate) {
                  shouldUpdate = shouldLibraryBeUpdated(library, artifact);
                  if (!shouldUpdate) break;
                }

                if (shouldUpdate) {
                  Promise.allSettled(
                    librariesToUpdate.map(library => {
                      return CQLLibrary.updateOne({ user: req.user?.uid || '', name: library.name }, library).exec();
                    })
                  );

                  const response = await CQLLibrary.insertMany(librariesToInsert);
                  if (duplicateLibraries.length > 0) {
                    // NOTE: Really, we should re-run cql-to-elm with the existing version of the duplicate files to
                    // confirm they work with the non-duplicate libraries.
                    const librariesNotUploaded = duplicateLibraries
                      .map(lib => `library ${lib.name} version ${lib.version}`)
                      .join(', ');
                    let message =
                      'Unable to upload external CQL because a library with an identical name and version ' +
                      `already exists: ${librariesNotUploaded}.`;
                    if (exportLibrariesNotUploaded.length > 0) {
                      message = message.concat(` ${exportLibrariesNotUploadedMessage}`);
                    }
                    if (newLibFHIRVersion) {
                      const response = await Artifact.updateOne(
                        { user: req.user?.uid || '', _id: artifactId },
                        { fhirVersion: newLibFHIRVersion }
                      ).exec();
                      response.matchedCount === 0 ? res.sendStatus(404) : res.status(201).send(message);
                    } else {
                      res.status(201).send(message);
                    }
                  } else {
                    if (exportLibrariesNotUploaded.length > 0) {
                      if (newLibFHIRVersion) {
                        const response = await Artifact.updateOne(
                          { user: req.user?.uid || '', _id: artifactId },
                          { fhirVersion: newLibFHIRVersion }
                        ).exec();
                        response.matchedCount === 0
                          ? res.sendStatus(404)
                          : res.status(201).send(exportLibrariesNotUploadedMessage);
                      } else {
                        res.status(201).send(exportLibrariesNotUploadedMessage);
                      }
                    } else {
                      let updateMessage;
                      if (librariesToUpdate.length > 0)
                        updateMessage = 'One or more of the libraries in this artifact have been updated.';
                      if (newLibFHIRVersion) {
                        const response = await Artifact.updateOne(
                          { user: req.user?.uid || '', _id: artifactId },
                          { fhirVersion: newLibFHIRVersion }
                        ).exec();
                        if (response.matchedCount === 0) {
                          res.sendStatus(404);
                        } else if (updateMessage) {
                          res.status(201).send(updateMessage);
                        } else {
                          res.status(201).json(response);
                        }
                      } else {
                        if (updateMessage) {
                          res.status(201).send(updateMessage);
                        } else {
                          res.status(201).json(response);
                        }
                      }
                    }
                  }
                } else {
                  const message =
                    'Unable to upload external CQL because the updated CQL contains incompatible modifications to ' +
                    'definitions/functions that this CDS artifact currently uses. To fix this, remove uses of the ' +
                    'affected CQL definitions/functions in this artifact or update the external CQL to retain ' +
                    'compatible versions of the definitions/functions that this artifact uses.';
                  res.status(400).send(message);
                }
              }
            } catch (err) {
              res.status(500).send(err);
            }
          });
        })
        .catch((err: unknown) => res.status(500).send(err));
    } else {
      const cqlJson = {
        filename: cqlFileName,
        text: decodedBuffer.toString(),
        type: 'text/plain'
      };

      const files = [cqlJson];

      cqlHandler.makeCQLtoELMRequest(files, [], false, async (err, elmFiles) => {
        if (err) {
          res.status(500).send(err);
          return;
        }

        const { elmErrors, elmResultsToSave, notFHIR } = parseELMFiles(
          (elmFiles as Array<{ content: string; name?: string }>) || [],
          artifactId,
          req.user?.uid || '',
          files
        );

        if (notFHIR) {
          res
            .status(400)
            .send(
              'Unable to upload external CQL because it uses a data model that is not FHIR®. The CDS Authoring Tool ' +
                'only supports external CQL libraries that use the FHIR® data model.'
            );
          return;
        }

        elmResultsToSave.forEach((elmResult: Record<string, unknown>) => {
          if (doesUploadedLibraryMatchArtifactName(elmResult.name as string, artifact.name as string)) {
            duplicateLib.flag = true;
            duplicateLib.libraryName = elmResult.name as string;
          }
        });

        if (duplicateLib.flag) {
          res
            .status(400)
            .send(
              `Unable to upload external CQL because the library '${duplicateLib.libraryName}' shares the same name ` +
                'as the artifact itself. To fix this, either rename this artifact in the CDS Authoring Tool or ' +
                'rename the external CQL library and try again.'
            );
          return;
        }

        try {
          const libraries = await CQLLibrary.find({ user: req.user?.uid || '', linkedArtifactId: artifactId }).exec();
          const elmResult = elmResultsToSave[0] as Record<string, unknown>; // This is the single file upload case, so elmResultsToSave will only ever have one item.
          const defaultLibrary = authoringToolExports.map(l => l.name).includes(elmResult.name as string);
          const { documentsToPlainObjects } = await import('../utils/mongooseHelpers.js');
          const librariesArray = documentsToPlainObjects(libraries);
          const dupName = librariesArray.find(
            (lib: Record<string, unknown>) => (lib.name as string) === (elmResult.name as string)
          );
          const dupVersion = librariesArray.find(
            (lib: Record<string, unknown>) => (lib.version as string) === (elmResult.version as string)
          );
          const newLibFHIRVersion = elmResult.fhirVersion as string | undefined;
          const fhirVersion = getCurrentFHIRVersion(libraries);
          // If the artifact FHIR version is R4 wildcard, set it to whatever R4 is being used.
          if (artifactFHIRVersion === '4.0.x') {
            if (newLibFHIRVersion && typeof newLibFHIRVersion === 'string' && newLibFHIRVersion.startsWith('4.0.')) {
              artifactFHIRVersion = newLibFHIRVersion;
            } else if (fhirVersion && fhirVersion.startsWith('4.0.')) {
              artifactFHIRVersion = fhirVersion;
            }
          }

          // If no FHIR version locked, any version can be uploaded.
          // If no FHIR version used by the library, it can be uploaded
          const fhirVersionsMatch = fhirVersion && newLibFHIRVersion ? fhirVersion === newLibFHIRVersion : true;
          // If new library has no FHIR version or it matches a supported FHIR version, we support it
          const supportedFHIRVersion =
            newLibFHIRVersion === '' || supportedFHIRVersions.findIndex(v => v === newLibFHIRVersion) !== -1;

          const artifactFHIRVersionsMatch =
            newLibFHIRVersion && artifactFHIRVersion ? newLibFHIRVersion === artifactFHIRVersion : true;

          if (elmErrors.length > 0) {
            res.status(400).send(elmErrors);
          } else if (defaultLibrary) {
            res
              .status(200)
              .send(
                'The following library was not uploaded because the CDS Authoring Tool already includes a ' +
                  `version of the same library by default: ${elmResult.name}. No further action is ` +
                  'necessary.'
              );
          } else if (!fhirVersionsMatch) {
            const message =
              'Unable to upload external CQL because a library using a different version of FHIR® is already ' +
              'uploaded. Only one FHIR® version can be supported at a time. To fix this, either remove the ' +
              'previously uploaded FHIR® libraries or upload new libraries that use the same version of FHIR®.';
            res.status(400).send(message);
          } else if (!supportedFHIRVersion) {
            res
              .status(400)
              .send(
                'Unable to upload external CQL because it uses an unsupported FHIR® version. The CDS Authoring ' +
                  'Tool currently supports CQL using the following FHIR® versions: 1.0.2, 3.0.0, 4.0.0, or ' +
                  '4.0.1. To fix this, upload a new library that uses one of the supported versions.'
              );
          } else if (!artifactFHIRVersionsMatch) {
            const message =
              'Unable to upload external CQL because it uses a different version of FHIR® than this artifact ' +
              `requires. To fix this, only upload libraries that use FHIR ${artifactFHIRVersion}.`;
            res.status(400).send(message);
          } else if (dupName) {
            if (dupVersion) {
              res
                .status(200)
                .send(
                  'Unable to upload external CQL because a library with an identical name and version ' +
                    `already exists: ${elmResult.name}.`
                );
            } else {
              if (shouldLibraryBeUpdated(elmResult, artifact)) {
                await CQLLibrary.updateOne(
                  { user: req.user?.uid || '', name: elmResult.name as string },
                  elmResult
                ).exec();
                const message = `Library ${elmResult.name} successfully updated to version ${elmResult.version}.`;
                res.status(200).send(message);
              } else {
                const message =
                  'Unable to upload external CQL because the updated CQL contains incompatible modifications to ' +
                  'definitions/functions that this CDS artifact currently uses. To fix this, remove uses of the ' +
                  'affected CQL definitions/functions in this artifact or update the external CQL to retain ' +
                  'compatible versions of the definitions/functions that this artifact uses.';
                res.status(400).send(message);
              }
            }
          } else {
            const response = await CQLLibrary.insertMany(elmResult);
            // If the new library has a FHIR version, it can only be added if it either first sets a FHIR version
            // or it matches so update the artifact to that FHIR version
            if (newLibFHIRVersion) {
              const updateResponse = await Artifact.updateOne(
                { user: req.user?.uid || '', _id: artifactId },
                { fhirVersion: newLibFHIRVersion }
              ).exec();
              updateResponse.matchedCount === 0 ? res.sendStatus(404) : res.status(201).json(updateResponse);
            } else {
              res.status(201).json(response);
            }
          }
        } catch (err) {
          res.status(500).send(err);
        }
      });
    }
  } else {
    sendUnauthorized(res);
  }
}

const artifactHasCustomModifiers = (artifact: ArtifactStructure): boolean => {
  const parseElementTree = (instance: ArtifactElement | undefined): boolean => {
    if (!instance) return false;
    const childInstances = instance.childInstances;
    if (!childInstances || childInstances.length === 0) {
      const modifiers = instance.modifiers || [];
      return modifiers.some(mod => Boolean(mod.where));
    }

    return Boolean(
      childInstances.some((child: ArtifactElement) =>
        child.conjunction ? parseElementTree(child) : (child.modifiers || []).some(mod => Boolean(mod.where))
      )
    );
  };

  return (
    parseElementTree(artifact.expTreeInclude) ||
    parseElementTree(artifact.expTreeExclude) ||
    (artifact.subpopulations || []).some(subpopulation => parseElementTree(subpopulation)) ||
    (artifact.baseElements || []).some(baseElement => parseElementTree(baseElement))
  );
};

const artifactHasServiceRequest = (artifact: ArtifactStructure): boolean => {
  const parseElementTree = (instance: ArtifactElement | undefined): boolean => {
    if (!instance) return false;
    const childInstances = instance.childInstances;
    return Boolean(
      childInstances &&
        childInstances.some((child: ArtifactElement) =>
          child.conjunction ? parseElementTree(child) : child.name === 'Service Request'
        )
    );
  };

  let serviceRequestFound = false;

  serviceRequestFound = parseElementTree(artifact.expTreeInclude) || parseElementTree(artifact.expTreeExclude);

  (artifact.subpopulations || [])
    .filter(elem => !elem.special)
    .forEach(subpopulation => {
      serviceRequestFound = serviceRequestFound || parseElementTree(subpopulation);
    });

  (artifact.baseElements || []).forEach(instance => {
    if (instance.name === 'Service Request') serviceRequestFound = true;
  });

  (artifact.baseElements || []).forEach(instance => {
    const conjunctions = ['Union', 'And', 'Or', 'Intersect'];
    if (instance.name === 'Service Request') serviceRequestFound = true;
    else if (instance.name && conjunctions.includes(instance.name))
      serviceRequestFound = serviceRequestFound || parseElementTree(instance);
  });

  return serviceRequestFound;
};

// Delete a single external CQL library
async function singleDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.user) {
    const { id } = req.params;
    try {
      const response = await CQLLibrary.findOneAndDelete({ user: req.user.uid, _id: id }).exec();
      if (response == null) {
        res.sendStatus(404);
      } else {
        const linkedArtifactId = response.linkedArtifactId;
        const libraries = await CQLLibrary.find({ user: req.user.uid, linkedArtifactId }).exec();
        const artifactResponse = await Artifact.findById(linkedArtifactId).exec();
        if (artifactResponse) {
          let currentFHIRVersion: string;
          const { documentToPlainObject } = await import('../utils/mongooseHelpers.js');
          const artifactRecord = documentToPlainObject(artifactResponse);
          if (artifactHasServiceRequest(artifactRecord)) {
            currentFHIRVersion = '4.0.x';
          } else if (artifactHasCustomModifiers(artifactRecord)) {
            currentFHIRVersion = (artifactResponse.fhirVersion as string) || '';
          } else {
            currentFHIRVersion = getCurrentFHIRVersion(libraries);
          }
          // If the version is 4.0.0 or 4.0.1, but we don't have any external CQL files,
          // then we can safely treat it as 4.0.x since nothing else is 4.0.0/4.0.1-specific.
          if (/4\.0\.[01]/.test(currentFHIRVersion) && libraries.length === 0) {
            currentFHIRVersion = '4.0.x';
          }
          const updateResponse = await Artifact.updateOne(
            { user: req.user.uid, _id: linkedArtifactId },
            { fhirVersion: currentFHIRVersion }
          ).exec();
          updateResponse.matchedCount === 0 ? res.sendStatus(404) : res.sendStatus(200);
        } else {
          res.sendStatus(200);
        }
      }
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    sendUnauthorized(res);
  }
}

export default {
  allGet,
  singleGet,
  singlePost,
  singleDelete
};
