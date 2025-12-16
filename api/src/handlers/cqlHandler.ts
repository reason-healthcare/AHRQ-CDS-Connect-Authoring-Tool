import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import _ from 'lodash';
import slug from 'slug';
// @ts-ignore - ejs doesn't have type definitions
import ejs from 'ejs';
import archiver from 'archiver';
import axios from 'axios';
import FormData from 'form-data';
// @ts-ignore - busboy doesn't have type definitions
import busboy from 'busboy';

import config from '../config.js';
import Artifact from '../models/artifact.js';
import CQLLibrary from '../models/cqlLibrary.js';
import exportCQL from '../cql-merge/export/exportCQL.js';
import importCQL from '../cql-merge/import/importCQL.js';
import RawCQL from '../cql-merge/utils/RawCQL.js';
import { AuthenticatedRequest, sendUnauthorized } from './common.js';
import type {
  ArtifactElement,
  ArtifactParameter,
  ArtifactSubpopulation,
  ArtifactRecommendation,
  ArtifactErrorStatement,
  ArtifactField,
  ArtifactStructure,
  ArtifactContext,
  ArtifactModifier
} from '../types/artifact.js';

// Import JSON files using fs.readFileSync - read from src/data (not dist/data)
const dstu2_resources = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/query_builder/dstu2_resources.json'), 'utf-8')
) as Record<string, unknown>;
const stu3_resources = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/query_builder/stu3_resources.json'), 'utf-8')
) as Record<string, unknown>;
const r4_resources = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/query_builder/r4_resources.json'), 'utf-8')
) as Record<string, unknown>;
const operators = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/query_builder/operators.json'), 'utf-8')
) as Record<string, unknown>;

const queryResources: Record<string, Record<string, unknown>> = {
  dstu2_resources,
  stu3_resources,
  r4_resources,
  operators
};

const templatePath = path.join(__dirname, '../data/cql/templates');
const specificPath = path.join(__dirname, '../data/cql/specificTemplates');
const modifierPath = path.join(__dirname, '../data/cql/modifiers');
const rulePath = path.join(__dirname, '../data/cql/rules');
const artifactPath = path.join(__dirname, '../data/cql/artifact.ejs');
const specificMap = loadTemplates(specificPath);
const templateMap = loadTemplates(templatePath);
const modifierMap = loadTemplates(modifierPath);
const ruleMap = loadTemplates(rulePath);
// Each library will be included. Aliases are optional.

const getCQLValueString = (
  externalCQLArgument: Record<string, unknown>,
  codeSystemMap: Map<string, { name: string; id: string }>
): string => {
  switch (externalCQLArgument.type) {
    case 'integer':
    case 'boolean':
    case 'string':
      return externalCQLArgument.selected as string;
    case 'decimal':
      return parseFloat((externalCQLArgument.selected as { str: string }).str).toString();
    case 'system_code':
    case 'system_concept':
      const selected = externalCQLArgument.selected as { system?: string; uri?: string; code?: string; str: string };
      if (selected.system && selected.uri) {
        if (codeSystemMap.get(selected.system) && selected.system === 'Other') {
          let systemUID: string;
          let ctr = 0;
          do {
            ctr += 1;
            systemUID = selected.system.concat(`_${ctr.toString()}`);
          } while (codeSystemMap.get(systemUID));
          codeSystemMap.set(systemUID, {
            name: systemUID,
            id: selected.uri
          });
          if (externalCQLArgument.type === 'system_concept')
            return `Concept { Code '${selected.code}' from "${systemUID}" }`;
          else return `Code '${selected.code}' from "${systemUID}"`;
        } else {
          codeSystemMap.set(selected.system, {
            name: selected.system,
            id: selected.uri
          });
        }
      }
      return selected.str;

    default:
      return (externalCQLArgument.selected as { str: string }).str;
  }
};

const includeLibrariesDstu2 = [
  { name: 'FHIRHelpers', version: '1.0.2', alias: 'FHIRHelpers' },
  {
    name: 'AT_Internal_CDS_Connect_Commons_for_FHIRv102',
    version: '1.3.5',
    alias: 'C3F'
  },
  {
    name: 'AT_Internal_CDS_Connect_Conversions',
    version: '1',
    alias: 'Convert'
  }
];

const includeLibrariesStu3 = [
  { name: 'FHIRHelpers', version: '3.0.0', alias: 'FHIRHelpers' },
  {
    name: 'AT_Internal_CDS_Connect_Commons_for_FHIRv300',
    version: '1.0.4',
    alias: 'C3F'
  },
  {
    name: 'AT_Internal_CDS_Connect_Conversions',
    version: '1',
    alias: 'Convert'
  }
];

const includeLibrariesR400 = [
  { name: 'FHIRHelpers', version: '4.0.0', alias: 'FHIRHelpers' },
  {
    name: 'AT_Internal_CDS_Connect_Commons_for_FHIRv400',
    version: '1.0.5',
    alias: 'C3F'
  },
  {
    name: 'AT_Internal_CDS_Connect_Conversions',
    version: '1',
    alias: 'Convert'
  }
];

const includeLibrariesR401 = [
  { name: 'FHIRHelpers', version: '4.0.1', alias: 'FHIRHelpers' },
  {
    name: 'AT_Internal_CDS_Connect_Commons_for_FHIRv401',
    version: '1.1.1',
    alias: 'C3F'
  },
  {
    name: 'AT_Internal_CDS_Connect_Conversions',
    version: '1',
    alias: 'Convert'
  }
];

const includeLibrariesMap = {
  '1.0.2': includeLibrariesDstu2,
  '3.0.0': includeLibrariesStu3,
  '4.0.0': includeLibrariesR400,
  '4.0.1': includeLibrariesR401
};

const queryResourceMap = {
  list_of_observations: 'Observation',
  list_of_conditions: 'Condition',
  list_of_medication_statements: 'MedicationStatement',
  list_of_medication_requests: 'MedicationRequest',
  list_of_procedures: 'Procedure',
  list_of_allergy_intolerances: 'AllergyIntolerance',
  list_of_encounters: 'Encounter',
  list_of_immunizations: 'Immunization',
  list_of_devices: 'Device',
  list_of_service_requests: 'ServiceRequest'
};

const queryAliasMap = {
  list_of_observations: 'Ob',
  list_of_conditions: 'Co',
  list_of_medication_statements: 'MS',
  list_of_medication_requests: 'MR',
  list_of_procedures: 'Pr',
  list_of_allergy_intolerances: 'AI',
  list_of_encounters: 'En',
  list_of_immunizations: 'Im',
  list_of_devices: 'De',
  list_of_service_requests: 'SR'
};

// A flag to hold the FHIR version, so that it can be used
// in functions external to the artifact.
let fhirTarget: { version?: string } | undefined;

function getFieldWithType(fields: ArtifactField[], type: string): ArtifactField | undefined {
  return fields.find(f => f.type?.endsWith(type));
}

function getFieldWithId(fields: ArtifactField[], id: string): ArtifactField | undefined {
  return fields.find(f => f.id === id);
}

function loadTemplates(pathToTemplates: string): Record<string, string> {
  const templates: Record<string, string> = {};
  // Loop through all the files in the temp directory
  fs.readdir(pathToTemplates, (err, files) => {
    if (err) {
      console.error('Could not list the directory.', err);
    }

    files.forEach(file => {
      templates[file] = fs.readFileSync(path.join(pathToTemplates, file), 'utf-8');
    });
  });
  return templates;
}

// This creates the context EJS uses to create a union of queries using different valuesets
function createMultipleValueSetExpression(
  id: string,
  valuesets: Array<{ name?: string; oid?: string; [key: string]: string | undefined }>,
  type: string
) {
  const groupedContext = {
    template: 'MultipleValuesetsExpression',
    name: id,
    valuesets,
    type
  };
  return groupedContext;
}

// This creates the context EJS uses to create a union of C3F function calls for comparing for a specific concept
function createMultipleConceptExpression(
  id: string,
  concepts: Array<{ code?: string; system?: string; display?: string; [key: string]: string | undefined }>,
  type: string
) {
  const groupedContext = {
    name: id,
    concepts,
    type
  };
  return groupedContext;
}

// This creates the context EJS uses to simply union expression together and referencing that expression.
function unionExpressions(
  context: Record<string, unknown>,
  name: string,
  unionedElementsList: Array<Record<string, unknown>>
): void {
  let duplicateNameElements = unionedElementsList.filter((element: Record<string, unknown>) =>
    (element.name as string).includes(name)
  );
  const count = duplicateNameElements.length;
  let uniqueName = `${name}_union`;
  if (count > 0) {
    uniqueName = `${name}_union_${count}`;
  }

  const expressionToUnion = {
    name: uniqueName,
    expressionList: context.values
  };
  unionedElementsList.push(expressionToUnion);
  context.values = [`"${uniqueName}"`];
}

function addGroupedValueSetExpression(
  referencedElements: Array<Record<string, unknown>>,
  resourceMap: Map<string, unknown>,
  valuesets: Record<string, unknown>,
  type: string,
  context: Record<string, unknown>
): void {
  // Check for duplicate expression name and appened an integer if it is not unique
  let duplicateNameElements = referencedElements.filter((element: Record<string, unknown>) =>
    (element.name as string).includes(valuesets.id as string)
  );
  const count = duplicateNameElements.length;
  let uniqueName = `${valuesets.id}_valuesets`;
  if (count > 0) {
    uniqueName = `${valuesets.id}_valuesets_${count}`;
  }

  // Reference the grouped expression on the original element
  if (count > 0) {
    context.values = [`"${valuesets.id}_valuesets_${count}"`];
  } else {
    context.values = [`"${valuesets.id}_valuesets"`];
  }

  // Add value sets to be grouped onto the list of value sets defined at the top
  ((valuesets.valuesets as Array<Record<string, unknown>>) || []).forEach((vs: Record<string, unknown>) => {
    const count = getCountForUniqueExpressionName(vs, resourceMap, 'name', 'oid');
    if (count > 0) {
      vs.name = `${vs.name}_${count}`;
    }
  });

  // Create grouped expression
  const multipleValueSetExpression = createMultipleValueSetExpression(
    uniqueName,
    (valuesets.valuesets as Array<{ name?: string; oid?: string; [key: string]: string | undefined }>) || [],
    type
  );
  referencedElements.push(multipleValueSetExpression);
}

function addGroupedConceptExpression(
  referencedConceptElements: Array<Record<string, unknown>>,
  _resourceMap: Map<string, unknown>,
  valuesets: Record<string, unknown>,
  type: string,
  context: Record<string, unknown>
): void {
  // Check for duplicated expression name and append an integer if it is not unique
  let duplicateNameElements = referencedConceptElements.filter((element: Record<string, unknown>) =>
    (element.name as string).includes(valuesets.id as string)
  );
  const count = duplicateNameElements.length;
  let uniqueName = `${valuesets.id}_concepts`;
  if (count > 0) {
    uniqueName = `${valuesets.id}_concepts_${count}`;
  }

  // Reference the grouped expression on the original element
  const contextValues = (context.values as Array<string>) || [];
  if (count > 0) {
    contextValues.push(`"${valuesets.id}_concepts_${count}"`);
  } else {
    contextValues.push(`"${valuesets.id}_concepts"`);
  }
  context.values = contextValues;

  // Create grouped expression
  const multipleConceptExpression = createMultipleConceptExpression(
    uniqueName,
    (valuesets.concepts as Array<{
      code?: string;
      system?: string;
      display?: string;
      [key: string]: string | undefined;
    }>) || [],
    type
  );
  referencedConceptElements.push(multipleConceptExpression);
}

function isBaseElementUseChanged(element: ArtifactElement, baseElements: ArtifactElement[]): boolean {
  const referenceField = getFieldWithType(
    (element.fields as Array<{ id: string; type: string; value?: { id: string } }>) || [],
    'reference'
  ) as { id: string; value?: { id: string } } | undefined;
  if (!referenceField) {
    // This case should never happen because an element of type base element will never NOT have a reference field
    return true;
  }

  const nameField = getFieldWithId(element.fields || [], 'element_name');
  const commentField = getFieldWithId(element.fields || [], 'comment');

  const originalBaseElement = baseElements.find(
    (baseEl: ArtifactElement) => referenceField.value?.id === baseEl.uniqueId
  );
  if (!originalBaseElement) {
    // This case should never happen because you can't delete base elements while in use.
    return true;
  }

  const originalBaseElementNameField = getFieldWithId(originalBaseElement.fields || [], 'element_name');
  if (nameField && originalBaseElementNameField && nameField.value !== originalBaseElementNameField.value) {
    // If the name of the use of the base element and the original base element are different, it's been changed.
    return true;
  }
  if ((element.modifiers || []).length > 0) {
    // If there are modifiers applied to the use of the base element, it's been changed.
    return true;
  }

  const originalCommentField = getFieldWithId(originalBaseElement.fields || [], 'comment');
  if (commentField && originalCommentField && commentField.value !== originalCommentField.value) {
    // If the comment on the use of the base element and the original element are different, it's been changed.
    return true;
  }

  return false;
}

function isParameterUseChanged(element: ArtifactElement, parameters: ArtifactParameter[]): boolean {
  const referenceField = getFieldWithType(
    (element.fields as Array<{ id: string; type: string; value?: { id: string } }>) || [],
    'reference'
  ) as { id: string; value?: { id: string } } | undefined;
  if (!referenceField) {
    // This case should never happen because an element of type parameter will never NOT have a reference field
    return true;
  }

  const nameField = getFieldWithId(element.fields || [], 'element_name');
  const commentField = getFieldWithId(element.fields || [], 'comment');

  const originalParameter = parameters.find((param: ArtifactParameter) => referenceField.value?.id === param.uniqueId);
  if (!originalParameter) {
    // This case should never happen because you can't delete parameters while in use.
    return true;
  }

  if (nameField && nameField.value !== originalParameter.name) {
    // If the name of the use of the parameter and the original parameter are different, it's been changed.
    return true;
  }
  if ((element.modifiers || []).length > 0) {
    // If there are modifiers applied to the use of the parameter, it's been changed.
    return true;
  }

  if (
    commentField &&
    !_.isEqual(
      createCommentArray(
        typeof commentField.value === 'string' || Array.isArray(commentField.value)
          ? (commentField.value as string | string[])
          : undefined
      ) || [],
      (Array.isArray(originalParameter.comment)
        ? originalParameter.comment
        : originalParameter.comment
          ? [originalParameter.comment]
          : []) || []
    )
  ) {
    // If the comment on the use of the parameter and the original parameter are different, it's been changed.
    return true;
  }

  return false;
}

function createCommentArray(comment: string | string[] | undefined): string[] | undefined {
  if (!comment) {
    return;
  }

  const finalCommentArray: Array<string> = [];
  const commentString = typeof comment === 'string' ? comment : String(comment);
  const commentArray = commentString.split(/\n\r|\r\n|\r|\n/g);
  // Render each line in the comment
  commentArray.forEach((c: string) => {
    let currentCommentString = c;
    // Break up long lines around the 100 character mark
    while (currentCommentString.length > 100) {
      let splitIndex = 100;
      let secondPart = currentCommentString.substring(splitIndex);
      // Don't split a line in the middle of a word
      while (!secondPart.startsWith(' ') && splitIndex < currentCommentString.length) {
        splitIndex += 1;
        secondPart = currentCommentString.substring(splitIndex);
      }
      const firstPart = currentCommentString.substring(0, splitIndex);
      // Get rid of the space on the new line. If splitIndex + 1 > currentCommentString.length, returns ''
      currentCommentString = currentCommentString.substring(splitIndex + 1);
      finalCommentArray.push(firstPart);
    }
    // Only push currentCommentString if it has content
    if (currentCommentString) finalCommentArray.push(currentCommentString);
  });
  return finalCommentArray;
}

// Class to handle all cql generation
class CqlArtifact {
  name: string;
  version: number;
  dataModel: { version?: string; name?: string; url?: string; [key: string]: string | undefined };
  includeLibraries: Array<{ name?: string; version?: string; path?: string; [key: string]: string | undefined }>;
  context: string;
  inclusions: ArtifactElement | undefined;
  parameters: ArtifactParameter[];
  exclusions: ArtifactElement | undefined;
  subpopulations: ArtifactSubpopulation[];
  baseElements: ArtifactElement[];
  recommendations: ArtifactRecommendation[];
  errorStatement: ArtifactErrorStatement | undefined;
  _id?: string;
  resourceMap!: Map<
    string,
    { name?: string; supportedVersions?: string[]; [key: string]: string | string[] | undefined }
  >;
  codeSystemMap!: Map<string, { name: string; id: string }>;
  codeMap!: Map<string, { code?: string; system?: string; display?: string; [key: string]: string | undefined }>;
  conceptMap!: Map<string, { code?: string; system?: string; display?: string; [key: string]: string | undefined }>;
  referencedElements!: ArtifactElement[];
  referencedConceptElements!: ArtifactElement[];
  unionedElements!: ArtifactElement[];
  contexts!: ArtifactContext[];
  conjunctions!: Array<Record<string, string | number | boolean | ArtifactElement[] | undefined>>;
  conjunction_main!: Array<Record<string, string | number | boolean | ArtifactElement[] | undefined>>;
  names!: Map<string, number>;

  constructor(artifact: ArtifactStructure) {
    this.name = slug(artifact.name || 'untitled', {
      lower: false
    });
    this.version =
      (typeof artifact.version === 'number' ? artifact.version : parseInt(artifact.version || '1', 10)) || 1;
    this.dataModel = artifact.dataModel || { version: '4.0.1' };
    if (this.dataModel.version === '4.0.x') {
      // default 4.0.x to to 4.0.1
      this.dataModel = _.cloneDeep(this.dataModel);
      this.dataModel.version = '4.0.1';
    }
    const dataModelVersion = this.dataModel.version;
    this.includeLibraries =
      dataModelVersion && dataModelVersion in includeLibrariesMap
        ? (includeLibrariesMap[dataModelVersion as keyof typeof includeLibrariesMap] as Array<{
            name?: string;
            version?: string;
            path?: string;
            [key: string]: string | undefined;
          }>) || includeLibrariesR401
        : includeLibrariesR401;
    this.includeLibraries = this.includeLibraries.concat(artifact.externalLibs || []);
    const artifactContext = Array.isArray(artifact.context) ? undefined : (artifact.context as string | undefined);
    this.context = typeof artifactContext === 'string' && artifactContext.length > 0 ? artifactContext : 'Patient';
    this.inclusions = artifact.expTreeInclude;
    this.parameters = artifact.parameters || [];
    this.exclusions = artifact.expTreeExclude;
    this.subpopulations = artifact.subpopulations || [];
    this.baseElements = artifact.baseElements || [];
    this.recommendations = artifact.recommendations || [];
    this.errorStatement = artifact.errorStatement;

    fhirTarget = this.dataModel;

    this.initialize();
  }

  initialize() {
    this.resourceMap = new Map();
    this.codeSystemMap = new Map();
    this.codeMap = new Map();
    this.conceptMap = new Map();
    this.referencedElements = [];
    this.referencedConceptElements = [];
    this.unionedElements = [];
    this.contexts = [];
    this.conjunctions = [];
    this.conjunction_main = [];
    this.names = new Map();

    this.parameters.forEach((parameter: ArtifactParameter) => {
      const count = getCountForUniqueExpressionName(parameter, this.names, 'name', '', false);
      if (count > 0) {
        parameter.name = `${parameter.name as string}_${count}`;
      }
      const paramValue = parameter.value as { unit?: string } | undefined;
      if (paramValue && paramValue.unit) {
        paramValue.unit = paramValue.unit.replace(/'/g, "\\'");
      }

      if (parameter.type === 'system_code' || parameter.type === 'system_concept') {
        let system = (_.get(parameter, 'value.system', '') as string).replace(/'/g, "\\'");
        let uri = (_.get(parameter, 'value.uri', '') as string).replace(/'/g, "\\'");
        if (system && uri) {
          this.codeSystemMap.set(system, { name: system, id: uri });
        }
      }

      if (parameter.comment) {
        parameter.comment = createCommentArray(parameter.comment);
      }

      const parameterTypeMap: Record<string, string> = {
        boolean: 'Boolean',
        system_code: 'Code',
        system_concept: 'Concept',
        integer: 'Integer',
        datetime: 'DateTime',
        decimal: 'Decimal',
        system_quantity: 'Quantity',
        string: 'String',
        time: 'Time',
        interval_of_integer: 'Interval<Integer>',
        interval_of_datetime: 'Interval<DateTime>',
        interval_of_decimal: 'Interval<Decimal>',
        interval_of_quantity: 'Interval<Quantity>'
      };

      parameter.type = parameterTypeMap[parameter.type as string] || parameter.type;
    });

    this.baseElements.forEach(baseElement => {
      let isBaseElementUseAndUnchanged = false;
      let isParameterUseAndUnchanged = false;
      if (baseElement.type === 'baseElement') {
        isBaseElementUseAndUnchanged = !isBaseElementUseChanged(baseElement, this.baseElements);
      }
      if (baseElement.type === 'parameter') {
        isParameterUseAndUnchanged = !isParameterUseChanged(baseElement, this.parameters);
      }
      const baseElementNameField = getFieldWithId((baseElement.fields as ArtifactField[]) || [], 'element_name') as
        | ArtifactField
        | undefined;
      if (baseElementNameField) {
        const count = getCountForUniqueExpressionName(
          baseElementNameField as Record<string, unknown>,
          this.names,
          'value',
          '',
          false
        );
        if (!(isBaseElementUseAndUnchanged || isParameterUseAndUnchanged) && count > 0) {
          baseElementNameField.value = `${baseElementNameField.value}_${count}`;
        }
      }

      if (baseElement.childInstances) {
        this.parseTree(baseElement);
      } else if (baseElement.type === 'parameter') {
        this.parseParameter(baseElement);
      } else {
        this.parseElement(baseElement);
      }
    });

    const inclusions = this.inclusions as { childInstances?: Array<unknown> };
    if (inclusions.childInstances && inclusions.childInstances.length) {
      this.parseTree(this.inclusions as Record<string, unknown>);
    }
    const exclusions = this.exclusions as { childInstances?: Array<unknown> };
    if (exclusions.childInstances && exclusions.childInstances.length) {
      this.parseTree(this.exclusions as Record<string, unknown>);
    }
    (this.subpopulations as Array<Record<string, unknown>>).forEach((subpopulation: Record<string, unknown>) => {
      const count = getCountForUniqueExpressionName(subpopulation, this.names, 'subpopulationName', '', false);
      if (count > 0) {
        // Update subpopulation's name and the other references to it
        subpopulation.subpopulationName = `${subpopulation.subpopulationName as string}_${count}`;
        this.checkOtherUses(subpopulation.subpopulationName as string, subpopulation.uniqueId as string);
      }
      if (!(subpopulation.special as boolean | undefined)) {
        // `Doesn't Meet Inclusion Criteria` and `Meets Exclusion Criteria` are special
        const subpopChildInstances = subpopulation.childInstances as Array<unknown> | undefined;
        if (subpopChildInstances && subpopChildInstances.length) {
          this.parseTree(subpopulation);
        }
      }
    });
  }

  checkOtherUses(name: string, id: string): void {
    (this.recommendations as Array<Record<string, unknown>>).forEach((recommendation: Record<string, unknown>) => {
      ((recommendation.subpopulations as Array<Record<string, unknown>>) || []).forEach(
        (subpop: Record<string, unknown>) => {
          if (subpop.uniqueId === id) {
            subpop.subpopulationName = name;
          }
        }
      );
    });

    const errorStatement = this.errorStatement as { ifThenClauses: Array<Record<string, unknown>> };
    errorStatement.ifThenClauses.forEach((ifThenClause: Record<string, unknown>) => {
      const ifCondition = ifThenClause.ifCondition as { uniqueId?: string; value?: string };
      if (ifCondition.uniqueId === id) {
        ifCondition.value = `"${name}"`;
      }
      const statements = ifThenClause.statements as { ifThenClauses?: Array<Record<string, unknown>> } | undefined;
      if (statements && statements.ifThenClauses) {
        statements.ifThenClauses.forEach((nestedIfThenClause: Record<string, unknown>) => {
          const nestedIfCondition = nestedIfThenClause.ifCondition as { uniqueId?: string; value?: string };
          if (nestedIfCondition.uniqueId === id) {
            nestedIfCondition.value = `"${name}"`;
          }
        });
      }
    });
  }

  setFieldContexts(
    elementDetails: Record<string, unknown>,
    valuesetQueryName: string,
    context: Record<string, unknown>
  ): void {
    const concepts = (elementDetails.concepts as Array<Record<string, unknown>>) || [];
    if (concepts.length > 0) {
      const values: Array<string> = [];
      concepts.forEach((concept: Record<string, unknown>) => {
        const conceptAdded = addConcepts(concept, this.codeSystemMap, this.codeMap, this.conceptMap);
        values.push(conceptAdded.name as string);
      });
      // Union multiple codes together.
      if (values.length > 1) {
        addGroupedConceptExpression(
          this.referencedConceptElements as Array<Record<string, unknown>>,
          this.resourceMap,
          elementDetails,
          valuesetQueryName,
          context
        );
        context.template = 'GenericStatement';
      } else {
        context.values = values;
      }
    }
    const valuesets = (elementDetails.valuesets as Array<Record<string, unknown>>) || [];
    if (valuesets.length > 0) {
      let conceptValues: Array<unknown> = [];
      if (context.values && (context.values as Array<unknown>).length > 0) {
        conceptValues = context.values as Array<unknown>;
      }
      // Union multiple value sets together.
      if (valuesets.length > 1) {
        addGroupedValueSetExpression(
          this.referencedElements as Array<Record<string, unknown>>,
          this.resourceMap,
          elementDetails,
          valuesetQueryName,
          context
        );
        context.template = 'GenericStatement';
        if (conceptValues.length > 0) {
          // If there is one concept, check to see if it is already a referenced/grouped element.
          const referencedConceptElements = this.referencedConceptElements as Array<Record<string, unknown>>;
          if (
            conceptValues.length === 1 &&
            !referencedConceptElements.find((el: Record<string, unknown>) => `"${el.name}"` === conceptValues[0])
          ) {
            addGroupedConceptExpression(
              referencedConceptElements,
              this.resourceMap,
              elementDetails,
              valuesetQueryName,
              context
            );
          } else {
            context.values = ((context.values as Array<unknown>) || []).concat(conceptValues);
          }
          // If both value sets and concepts are applied, union the individual expression together to create valid CQL
          unionExpressions(
            context,
            elementDetails.id as string,
            this.unionedElements as Array<Record<string, unknown>>
          );
        }
      } else {
        // elementDetails.valuesets.length = 1;
        if (conceptValues.length > 0) {
          addGroupedValueSetExpression(
            this.referencedElements as Array<Record<string, unknown>>,
            this.resourceMap,
            elementDetails,
            valuesetQueryName,
            context
          );
          // If there is one concept, check to see if it is already a referenced/grouped element.
          const referencedConceptElements = this.referencedConceptElements as Array<Record<string, unknown>>;
          if (
            conceptValues.length === 1 &&
            !referencedConceptElements.find((el: Record<string, unknown>) => `"${el.name}"` === conceptValues[0])
          ) {
            addGroupedConceptExpression(
              referencedConceptElements,
              this.resourceMap,
              elementDetails,
              valuesetQueryName,
              context
            );
          } else {
            // If concepts were already unioned, just add the variable to reference.
            context.values = ((context.values as Array<unknown>) || []).concat(conceptValues);
          }
          // If both value sets and concepts are applied, union the individual expression together to create valid CQL
          unionExpressions(
            context,
            elementDetails.id as string,
            this.unionedElements as Array<Record<string, unknown>>
          );
          context.template = 'GenericStatement';
        } else {
          context.values = valuesets.map((vs: Record<string, unknown>) => {
            const count = getCountForUniqueExpressionName(vs, this.resourceMap, 'name', 'oid');
            if (count > 0) {
              return `${vs.name as string}_${count}`;
            }
            return vs.name as string;
          });
        }
      }
    }
  }

  parseTree(element: Record<string, unknown>): void {
    let updatedElement = this.parseConjunction(element);
    const children = (updatedElement.childInstances as ArtifactElement[]) || [];
    children.forEach((child: ArtifactElement) => {
      if ('childInstances' in child) {
        this.parseTree(child);
      } else if (child.type === 'parameter') {
        this.parseParameter(child);
      } else {
        this.parseElement(child);
      }
    });
  }

  parseConjunction(element: Record<string, unknown>): Record<string, unknown> {
    const conjunction: Record<string, unknown> = { template: element.id, components: [] };
    // Assume it's in the population if they're referenced from the `Recommendations` tab
    conjunction.assumeInPopulation = (this.recommendations as Array<Record<string, unknown>>).some(
      (recommendation: Record<string, unknown>) =>
        ((recommendation.subpopulations as Array<Record<string, unknown>>) || []).some(
          (subpopref: Record<string, unknown>) => subpopref.subpopulationName === element.subpopulationName
        )
    );
    const fields = (element.fields as ArtifactField[]) || [];
    const nameField = getFieldWithId(fields, 'element_name') as ArtifactField | undefined;
    const name = nameField?.value as string | undefined;
    const commentField = getFieldWithId(fields, 'comment') as ArtifactField | undefined;
    // Older artifacts might not have a comment field -- so account for that.
    const comment =
      typeof commentField?.value === 'string' || Array.isArray(commentField?.value)
        ? (commentField.value as string | string[])
        : undefined;
    conjunction.element_name = name || (element.subpopulationName as string) || (element.uniqueId as string);
    conjunction.comment = createCommentArray(comment) || '';
    ((element.childInstances as ArtifactElement[]) || []).forEach((child: ArtifactElement) => {
      const childFields = (child.fields as ArtifactField[]) || [];
      const childNameField = getFieldWithId(childFields, 'element_name') as ArtifactField | undefined;
      let childName = (childNameField?.value as string | undefined) || (child.uniqueId as string);
      let isBaseElementUseAndUnchanged = false;
      let isParameterUseAndUnchanged = false;
      if (child.type === 'baseElement') {
        isBaseElementUseAndUnchanged = !isBaseElementUseChanged(child, this.baseElements);
      }
      if (child.type === 'parameter') {
        isParameterUseAndUnchanged = !isParameterUseChanged(child, this.parameters);
      }
      if (!(isBaseElementUseAndUnchanged || isParameterUseAndUnchanged)) {
        const childNameFieldRecord = childNameField as Record<string, unknown> | undefined;
        const childCount = childNameFieldRecord
          ? getCountForUniqueExpressionName(childNameFieldRecord, this.names, 'value', '', false)
          : 0;
        if (childCount > 0) {
          childName = `${childName}_${childCount}`;
          if (childNameField) {
            childNameField.value = childName;
          }
        }
      }
      const component: Record<string, unknown> = { name: childName };
      if ((element.id === 'Union' || element.id === 'Intersect') && (child.needToPromote as boolean | undefined)) {
        component.needToPromote = true;
      }
      (conjunction.components as Array<Record<string, unknown>>).push(component);
    });
    (this.conjunction_main as Array<Record<string, unknown>>).push(conjunction);
    return element;
  }

  parseParameter(element: ArtifactElement): void {
    const context: Record<string, unknown> = {};
    const fields = (element.fields as ArtifactField[]) || [];
    fields.forEach((field: ArtifactField) => {
      if (field.id === 'comment') {
        context[field.id] = createCommentArray(
          typeof field.value === 'string' || Array.isArray(field.value) ? (field.value as string | string[]) : undefined
        );
      } else {
        context[field.id] = field.value;
      }
    });
    context.template = 'GenericStatement';
    context.values = [`"${element.name as string}"`];
    context.modifiers = element.modifiers;
    if (isParameterUseChanged(element, this.parameters)) {
      this.contexts.push(context);
    }
  }

  // Generate context and resources for a single element
  parseElement(element: ArtifactElement): void {
    const context: Record<string, unknown> = {};
    if (element.extends) {
      context.template = (element.template as string) || (element.extends as string);
    } else {
      context.template = (element.template as string) || (element.id as string);
    }
    element.modifiers = (element.modifiers as ArtifactModifier[]) || [];
    context.withoutModifiers = _.has(specificMap, context.template as string);
    if (context.template === 'AgeRange') {
      const modifiers = element.modifiers as Array<Record<string, unknown>>;
      context.checkExistence = modifiers.some((modifier: Record<string, unknown>) => modifier.id === 'CheckExistence');
      if (context.checkExistence) {
        const checkExistenceModifier = modifiers.find(
          (modifier: Record<string, unknown>) => modifier.id === 'CheckExistence'
        );
        if (checkExistenceModifier) {
          const modValues = checkExistenceModifier.values as { value?: unknown } | undefined;
          context.checkExistenceValue = modValues?.value;
        }
      }
    }
    const fields = (element.fields as Array<Record<string, unknown>>) || [];
    fields.forEach((field: Record<string, unknown>) => {
      switch (field.type) {
        case 'observation_vsac': {
          // All information in observations array will be provided by the selections made on the frontend.
          const observationValueSets = {
            id: 'generic_observation', // This is needed for creating a separate union'ed variable name.
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            observationValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, observationValueSets, 'valuesets');
          this.setFieldContexts(observationValueSets, 'Observation', context);
          break;
        }
        case 'service_request_vsac': {
          const serviceRequestValueSets = {
            id: 'generic_service_request',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            serviceRequestValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, serviceRequestValueSets, 'valuesets');
          this.setFieldContexts(serviceRequestValueSets, 'ServiceRequest', context);
          break;
        }
        case 'number': {
          const fieldId = field.id as string;
          context[fieldId] = field.value;
          if ('exclusive' in field) {
            context[`${fieldId}_exclusive`] = (field as { exclusive?: unknown }).exclusive;
          }
          break;
        }
        case 'condition_vsac': {
          const conditionValueSets = {
            id: 'generic_condition',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            conditionValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, conditionValueSets, 'valuesets');
          this.setFieldContexts(conditionValueSets, 'Condition', context);
          break;
        }
        case 'medicationStatement_vsac': {
          const medicationStatementValueSets = {
            id: 'generic_medication_statement',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            medicationStatementValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, medicationStatementValueSets, 'valuesets');
          this.setFieldContexts(medicationStatementValueSets, 'MedicationStatement', context);
          break;
        }
        case 'medicationRequest_vsac': {
          const medicationRequestValueSets = {
            id: 'generic_medication_request',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            medicationRequestValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, medicationRequestValueSets, 'valuesets');
          if (fhirTarget && (fhirTarget.version as string) === '1.0.2') {
            this.setFieldContexts(medicationRequestValueSets, 'MedicationOrder', context);
          } else {
            this.setFieldContexts(medicationRequestValueSets, 'MedicationRequest', context);
          }
          break;
        }
        case 'procedure_vsac': {
          const procedureValueSets = {
            id: 'generic_procedure',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            procedureValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, procedureValueSets, 'valuesets');
          this.setFieldContexts(procedureValueSets, 'Procedure', context);
          break;
        }
        case 'encounter_vsac': {
          const encounterValueSets = {
            id: 'generic_encounter',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            encounterValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, encounterValueSets, 'valuesets');
          this.setFieldContexts(encounterValueSets, 'Encounter', context);
          break;
        }
        case 'allergyIntolerance_vsac': {
          const allergyIntoleranceValueSets = {
            id: 'generic_allergyIntolerance',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            allergyIntoleranceValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, allergyIntoleranceValueSets, 'valuesets');
          this.setFieldContexts(allergyIntoleranceValueSets, 'AllergyIntolerance', context);
          break;
        }
        case 'immunization_vsac': {
          const immunizationValueSets = {
            id: 'generic_immunization',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            immunizationValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, immunizationValueSets, 'valuesets');
          this.setFieldContexts(immunizationValueSets, 'Immunization', context);
          break;
        }
        case 'device_vsac': {
          const deviceValueSets = {
            id: 'generic_device',
            valuesets: [],
            concepts: []
          };
          buildConceptObjectForCodes(
            (field.codes as Array<Record<string, unknown>>) || undefined,
            deviceValueSets.concepts as Array<Record<string, unknown>>
          );
          addValueSets(field, deviceValueSets, 'valuesets');
          this.setFieldContexts(deviceValueSets, 'Device', context);
          break;
        }
        case 'reference': {
          // Need to pull the element name from the reference to support renaming the elements while being used.
          const fieldValue = field.value as Record<string, unknown> | undefined;
          if (field.id === 'parameterReference' && fieldValue) {
            const valueId = fieldValue.id as string;
            const referencedParameter = this.parameters.find((p: Record<string, unknown>) => p.uniqueId === valueId);
            if (referencedParameter) {
              const referencedParameterName =
                (referencedParameter.name as string) || (referencedParameter.uniqueId as string);
              context.values = [`"${referencedParameterName}"`];
            }
          } else if (field.id === 'baseElementReference' && fieldValue) {
            const valueId = fieldValue.id as string;
            const referencedElement = this.baseElements.find((e: ArtifactElement) => e.uniqueId === valueId);
            if (referencedElement) {
              const referencedElementFields = (referencedElement.fields as ArtifactField[]) || [];
              const nameField = getFieldWithId(referencedElementFields, 'element_name') as ArtifactField | undefined;
              const referencedElementName =
                (nameField?.value as string | undefined) || (referencedElement.uniqueId as string);
              context.values = [`"${referencedElementName}"`];
            }
          } else if (field.id === 'externalCqlReference' && fieldValue) {
            const fieldValueArgs = fieldValue.arguments as Array<Record<string, unknown>> | undefined;
            if (fieldValueArgs && Array.isArray(fieldValueArgs) && fieldValueArgs.length > 0) {
              const expandArgs = fieldValueArgs
                .map((arg: Record<string, unknown>) => {
                  const argValue = arg.value as Record<string, unknown> | undefined;
                  if (argValue) {
                    if (argValue.argSource && argValue.selected) {
                      if (argValue.argSource === 'editor' && argValue.selected != '') {
                        return getCQLValueString(argValue, this.codeSystemMap);
                      } else if (argValue.argSource === 'parameter') {
                        return `"${argValue.elementName as string}"`;
                      } else if (argValue.argSource === 'baseElement' && argValue.selected != '') {
                        return `"${argValue.elementName as string}"`;
                      } else if (argValue.argSource === 'externalCql' && argValue.elementName && argValue.elementType) {
                        return argValue.elementType === 'function'
                          ? `${argValue.elementName as string}()`
                          : (argValue.elementName as string);
                      }
                    }
                  }
                  return 'null';
                })
                .join(', ');
              context.values = [`"${fieldValue.library as string}"."${fieldValue.element as string}"(${expandArgs})`];
            } else if (
              (fieldValue.id as string | undefined)?.includes('Function') &&
              fieldValueArgs &&
              fieldValueArgs.length === 0
            ) {
              context.values = [`"${fieldValue.library as string}"."${fieldValue.element as string}"()`];
            } else {
              context.values = [`"${fieldValue.library as string}"."${fieldValue.element as string}"`];
            }
          }
          break;
        }
        case 'textarea': {
          const fieldId = field.id as string;
          if (field.id === 'comment') {
            context[fieldId] = createCommentArray(
              typeof field.value === 'string' || Array.isArray(field.value)
                ? (field.value as string | string[])
                : undefined
            );
          } else {
            context.values = (context.values as Array<unknown>) || [];
            context[fieldId] = field.value;
          }
          break;
        }
        default: {
          const fieldId = field.id as string;
          context.values = (context.values as Array<unknown>) || [];
          context[fieldId] = field.value;
          break;
        }
      }
    });

    context.modifiers = element.modifiers;
    context.element_name = context.element_name || element.uniqueId;
    // If it is an unchanged base element or parameter, don't add to context
    if (
      !(element.type === 'baseElement' && !isBaseElementUseChanged(element, this.baseElements)) &&
      !(element.type === 'parameter' && !isParameterUseChanged(element, this.parameters))
    ) {
      this.contexts.push(context);
    }
  }

  /* Modifiers Explanation:
    Within `formTemplates`, a template must be specified (unless extending an element that specifies a template).
    If no template is specified, it will look for a template named the same as the `id`.
    If the element specifies a template within the folder `specificTemplates` it's assumed that element will not have
      modifiers. In this case, just render the element.
    Otherwise:
      At this point, context.values should contain an array of each part of this element's CQL
        (e.g. ["CABG Surgeries", "Coronary artery bypass graft", "PCI ICD10CM SNOMEDCT", "PCI ICD9CM",
               "Carotid intervention"])
      Because each of these elements requires the modifier to be applied to them, loop through and render the base
        template (not modifier!)
        (e.g. ["[Procedure: "CABG Surgeries"]", "[Procedure: "Coronary artery bypass graft"]",
               "[Procedure: "PCI ICD10CM SNOMEDCT"]", "[Procedure: "PCI ICD9CM"]",
               "[Procedure: "Carotid intervention"]"])
      Then call `applyModifiers`. For each of these values, go through and apply each of the modifiers to them (by
        rendering the modifier template, and passing them in)
      Finally, join all these string with "\n  or " and return this (potentially-large) multi-line string.
      Render the `BaseTemplate`, which just gives adds the `define` statement, and inserts this string below it
  */

  // Generate cql for all elements
  body(): string {
    const contexts = this.contexts as Array<Record<string, unknown>>;
    const conjunctions = this.conjunctions as Array<Record<string, unknown>>;
    const conjunctionMain = this.conjunction_main as Array<Record<string, unknown>>;
    let expressions = contexts.concat(conjunctions);
    expressions = expressions.concat(conjunctionMain);
    return expressions
      .map((context: Record<string, unknown>) => {
        if (fhirTarget && fhirTarget.version && (fhirTarget.version as string).startsWith('1.0.')) {
          if (context.template === 'GenericMedicationRequest') context.template = 'GenericMedicationOrder';
          if (context.template === 'MedicationRequestsByConcept') context.template = 'MedicationOrdersByConcept';
        }
        if (context.withoutModifiers || context.components) {
          return ejs.render(specificMap[context.template as string], context);
        }
        const templateName = context.template as string;
        if (!(templateName in templateMap)) console.error(`Template could not be found: ${templateName}`);
        const contextValues = (context.values as Array<unknown>) || [];
        if (_.isEqual(contextValues, [])) {
          contextValues[0] = ejs.render(templateMap[templateName], {
            element_context: ''
          });
        } else {
          contextValues.forEach((value: unknown, index: number) => {
            contextValues[index] = ejs.render(templateMap[templateName], {
              element_context: value
            });
          });
        }
        const cqlString = applyModifiers.call(
          this,
          contextValues as Array<string>,
          (context.modifiers as Array<Record<string, unknown>>) || []
        );
        return ejs.render(templateMap.BaseTemplate, {
          comment: context.comment,
          element_name: context.element_name,
          cqlString
        });
      })
      .join('\n');
  }
  header() {
    return ejs.render(fs.readFileSync(artifactPath, 'utf-8'), this);
  }
  population(): string {
    const getTreeName = (tree: ArtifactElement) => {
      const treeFields = (tree.fields as ArtifactField[]) || [];
      const nameField = getFieldWithId(treeFields, 'element_name') as ArtifactField | undefined;
      return (nameField?.value as string | undefined) || (tree.uniqueId as string);
    };

    const inclusions = this.inclusions as { childInstances?: Array<unknown> };
    const exclusions = this.exclusions as { childInstances?: Array<unknown> };
    const treeNames = {
      inclusions:
        inclusions.childInstances && inclusions.childInstances.length && this.inclusions
          ? getTreeName(this.inclusions)
          : '',
      exclusions:
        exclusions.childInstances && exclusions.childInstances.length && this.exclusions
          ? getTreeName(this.exclusions)
          : ''
    };

    return ejs.render(fs.readFileSync(`${templatePath}/IncludeExclude`, 'utf-8'), treeNames);
  }

  recommendation(): string {
    const recommendations = this.recommendations as Array<Record<string, unknown>>;
    let text = recommendations.map((recommendation: Record<string, unknown>, index: number) => {
      let conditional = constructOneRecommendationConditional(recommendation, undefined);
      let comment = constructComment(recommendation.comment);
      let text = sanitizeCQLString(recommendation.text as string);
      if (index > 0) {
        conditional = 'else ' + conditional;
      }
      return { comment: comment, conditional: conditional, text: text };
    });
    return ejs.render(templateMap.RecommendationTemplate, {
      element_name: 'Recommendation',
      recs: text
    });
  }

  rationale(): string {
    const recommendations = this.recommendations as Array<Record<string, unknown>>;
    let rationaleText = recommendations.map((recommendation: Record<string, unknown>) => {
      const conditional = constructOneRecommendationConditional(recommendation, undefined);
      return (
        conditional +
        (_.isEmpty(recommendation.rationale) ? 'null' : `'${sanitizeCQLString(recommendation.rationale as string)}'`)
      );
    });
    const rationaleTextString = _.isEmpty(rationaleText)
      ? 'null'
      : rationaleText.join('\n  else ').concat('\n  else null');
    return ejs.render(templateMap.BaseTemplate, {
      element_name: 'Rationale',
      cqlString: rationaleTextString
    });
  }

  links(): string {
    const recommendations = this.recommendations as Array<Record<string, unknown>>;
    let linksText = recommendations.map((recommendation: Record<string, unknown>) => {
      const conditional = constructOneRecommendationConditional(recommendation, undefined);
      return (
        conditional +
        (_.isEmpty(recommendation.links)
          ? 'null'
          : constructLinks(recommendation.links as Array<Record<string, unknown>>))
      );
    });
    const linksTextString = _.isEmpty(linksText) ? 'null' : linksText.join('\n  else ').concat('\n  else null');
    return ejs.render(templateMap.BaseTemplate, {
      element_name: 'Links',
      cqlString: linksTextString
    });
  }

  suggestions(): string {
    const recommendations = this.recommendations as Array<Record<string, unknown>>;
    let suggestionsText = recommendations.map((recommendation: Record<string, unknown>) => {
      const conditional = constructOneRecommendationConditional(recommendation, undefined);
      return (
        conditional +
        (_.isEmpty(recommendation.suggestions)
          ? 'null'
          : this.constructSuggestion(recommendation.suggestions as Array<Record<string, unknown>>))
      );
    });
    const suggestionsTextString = _.isEmpty(suggestionsText)
      ? 'null'
      : suggestionsText.join('\n  else ').concat('\n  else null');
    return ejs.render(templateMap.BaseTemplate, {
      element_name: 'Suggestions',
      cqlString: suggestionsTextString
    });
  }

  constructSuggestion(suggestions: Array<Record<string, unknown>>): string {
    let suggestionsText = '';
    if (!_.isEmpty(suggestions)) {
      suggestionsText += 'List { ';
      suggestionsText += suggestions
        .map((suggestion: Record<string, unknown>) => {
          const suggestionText = `Tuple { label: '${sanitizeCQLString(suggestion.label as string)}', actions: List { `;
          const actionsText = ((suggestion.actions as Array<Record<string, unknown>>) || []).map(
            (action: Record<string, unknown>) => {
              const actionResource = action.resource as Record<string, unknown>;
              const renderData = { ...actionResource };
              Object.keys(actionResource)
                .filter((key: string) => typeof actionResource[key] === 'object') // the only objects are CodeableConcepts
                .forEach((key: string) => {
                  const resourceValue = actionResource[key] as { code?: string; system?: string } | undefined;
                  if (resourceValue && !(resourceValue.code === '' && resourceValue.system === '')) {
                    const concepts: Array<Record<string, unknown>> = [];
                    buildConceptObjectForCodes([actionResource[key] as Record<string, unknown>], concepts);
                    const conceptAdded = addConcepts(concepts[0], this.codeSystemMap, this.codeMap, this.conceptMap);
                    (renderData[key] as { name?: string }).name = conceptAdded.name as string;
                  }
                });
              let template: string | undefined;
              if (actionResource.resourceType === 'ServiceRequest') {
                template = templateMap.ServiceRequestResource;
              } else if (actionResource.resourceType === 'MedicationRequest') {
                template = templateMap.MedicationRequestResource;
              }
              if (template) {
                const resourceText = ejs.render(template, renderData);
                const actionText = `Tuple { type: 'create', description: '${sanitizeCQLString(action.description as string)}', resource: ${resourceText} }`;
                return actionText;
              }
              return '';
            }
          );
          return suggestionText + actionsText.join(', ') + ' } }';
        })
        .join(', ')
        .concat(' }');
    }
    return suggestionsText;
  }

  /*
    this function handles a condition in which the error statement is notionally null, but isn't exactly null
    if this function returns true,  the cql generated will be:
    define "Errors":
      null
  */
  isErrorEmpty(errorStatement: Record<string, unknown>): boolean {
    let retVal = false;
    const ifThenClauses = (errorStatement.ifThenClauses as Array<Record<string, unknown>>) || [];
    if (ifThenClauses.length > 0) {
      let firstIfThenClause = ifThenClauses[0];
      const ifCondition = firstIfThenClause.ifCondition as { label?: unknown } | undefined;
      if (
        _.isEmpty(ifCondition?.label) &&
        _.isEmpty(firstIfThenClause.statements) &&
        _.isEmpty(firstIfThenClause.thenClause) &&
        _.isEmpty(errorStatement.elseClause)
      ) {
        retVal = true;
      }
    }
    return retVal;
  }

  errors() {
    return ejs.render(templateMap.ErrorStatements, {
      element_name: 'Errors',
      errorStatement: this.errorStatement
    });
  }

  // Produces the cql in string format
  toString() {
    // Create the header after the body because elements in the body can add new value sets and codes to be used.
    const suggestionsString = this.suggestions();
    const bodyString = this.body();
    const headerString = this.header();
    let fullString =
      `${headerString}${bodyString}\n${this.population()}\n${this.recommendation()}\n` +
      `${this.rationale()}\n${this.links()}\n${suggestionsString}\n${this.errors()}`;
    fullString = fullString.replace(/\r\n|\r|\n/g, '\r\n'); // Make all line endings CRLF
    return fullString;
  }

  // Return a cql file as a json object
  toJson(): { name: string; version: number; filename: string; text: string; type: string } {
    return {
      name: this.name,
      version: this.version,
      filename: this.name,
      text: this.toString(),
      type: 'text/plain'
    };
  }
}

// Replaces all instances of `'` in the string with the escaped `\'` - Might be expanded in the future
function sanitizeCQLString(cqlString: string): string {
  return _.replace(cqlString, /'/g, "\\'");
}

// Recurse down the tree of a modifier built in the query builder
function checkRules(
  rule: Record<string, unknown>,
  value_name: string,
  inputType: string,
  codeSystemMap: Map<string, { name: string; id: string }>,
  codeMap: Map<string, unknown>,
  conceptMap: Map<string, unknown>,
  resourceMap: Map<string, unknown>,
  isRoot = false,
  isFirstModifier = false
): string | undefined {
  // Leaf node
  // TODO: Refactor to remove use of rule.ruleType.  We support it for now mainly because all
  // of the operator template tests assume rule.ruleType and many of them are already in flight
  // in other PRs.  So for now, the code supports either way: rule.operator or rule.ruleType.
  const ruleOperator = rule.operator as { id?: string } | undefined;
  if (ruleOperator && ruleOperator.id) {
    rule.ruleType = ruleOperator.id;
  }
  if (rule.ruleType) {
    const operators = (queryResources.operators as { operators?: Array<Record<string, unknown>> })?.operators || [];
    const operator = operators.find((op: Record<string, unknown>) => op.id === rule.ruleType);
    if (!operator) {
      console.error(`Operator could not be found for rule: ${rule.ruleType}`);
      return;
    }
    const operatorTemplate = operator.operatorTemplate as string | undefined;
    const ruleToRender = operatorTemplate ? ruleMap[operatorTemplate] : undefined;
    if (!operatorTemplate || !ruleToRender) {
      console.error(`No template found for operator: ${operator.name as string}`);
      return;
    }
    let resources: Array<Record<string, unknown>>;
    if (fhirTarget && fhirTarget.version) {
      switch (fhirTarget.version as string) {
        case '1.0.2':
          resources =
            (queryResources.dstu2_resources as { resources?: Array<Record<string, unknown>> })?.resources || [];
          break;
        case '3.0.0':
          resources =
            (queryResources.stu3_resources as { resources?: Array<Record<string, unknown>> })?.resources || [];
          break;
        default:
          resources = (queryResources.r4_resources as { resources?: Array<Record<string, unknown>> })?.resources || [];
          break;
      }
    } else {
      resources = (queryResources.r4_resources as { resources?: Array<Record<string, unknown>> })?.resources || [];
    }
    const inputTypeResource = queryResourceMap[inputType as keyof typeof queryResourceMap] || inputType;
    const resource = resources.find(
      (r: Record<string, unknown>) =>
        r.name === inputTypeResource || (r.name === 'MedicationOrder' && inputTypeResource === 'MedicationRequest')
    );

    if (!resource) {
      console.error(`Resource could not be found for inputType: ${inputTypeResource}`);
      return;
    }

    let resourceProperty = rule.resourceProperty as string;
    const resourceProperties = (resource.properties as Array<Record<string, unknown>>) || [];
    let resourcePropertyInfo = resourceProperties.find((p: Record<string, unknown>) => p.name === resourceProperty);
    let typeSpecifier: { elementType?: string } | undefined;
    if (resourcePropertyInfo != null) {
      typeSpecifier = resourcePropertyInfo.typeSpecifier as { elementType?: string } | undefined;
    } else {
      // It's a choice type, so get the typeSpecifier from the specific choice
      const choiceProperties = resourceProperties.filter((p: Record<string, unknown>) => {
        const typeSpec = p.typeSpecifier as { type?: string } | undefined;
        return typeSpec?.type === 'ChoiceTypeSpecifier';
      });
      for (const p of choiceProperties) {
        const pTypeSpec = p.typeSpecifier as { elementType?: Array<Record<string, unknown>> } | undefined;
        const matchingChoice = (pTypeSpec?.elementType || []).find(
          (c: Record<string, unknown>) => c.name === resourceProperty
        );
        if (matchingChoice) {
          typeSpecifier = matchingChoice.typeSpecifier as { elementType?: string };
          // Choice types need to be cast in STU3/R4
          if (fhirTarget && (fhirTarget.version as string) !== '1.0.2') {
            resourceProperty = `${p.name as string} as ${typeSpecifier.elementType || ''}`;
          }
          resourcePropertyInfo = p;
          break;
        }
      }
    }

    // Handle codes that need to be added to the top of the CQL file
    const concepts: Array<Record<string, unknown>> = [];
    // First: User-specified concepts (w/ arbitrary systems)
    if (rule.conceptValue || rule.conceptValues) {
      const conceptValues = rule.conceptValues || [rule.conceptValue];
      const codes = ((conceptValues as Array<Record<string, unknown>>) || []).map((c: Record<string, unknown>) => {
        return { code: c.code, codeSystem: { name: c.system, id: c.uri }, display: c.display };
      });
      buildConceptObjectForCodes(codes, concepts);
    }
    // Then predefined concepts w/ predefined systems
    const predefinedSystem = resourcePropertyInfo
      ? (resourcePropertyInfo.predefinedSystem as { name?: string; url?: string } | undefined)
      : undefined;
    if (
      rule.codeValue &&
      resourcePropertyInfo &&
      predefinedSystem &&
      typeSpecifier &&
      typeSpecifier.elementType !== 'FHIR.code'
    ) {
      const codes = ((rule.codeValue as Array<string>) || []).map((c: string) => {
        return {
          code: c,
          codeSystem: {
            name: predefinedSystem.name || '',
            id: predefinedSystem.url || ''
          },
          // convert codes like social-history to "Social History" and entered-in-error to "Entered in Error"
          display: c
            .split('-')
            .map((s: string) => (s !== 'in' ? _.upperFirst(s) : s))
            .join(' ')
        };
      });
      buildConceptObjectForCodes(codes, concepts);
    }
    // Then add the concepts to the CQL document and collect the concept names (in case they changed)
    const codeNames = concepts.map(
      (concept: Record<string, unknown>) => addConcepts(concept, codeSystemMap, codeMap, conceptMap).name as string
    );
    // Handle ValueSets that need to be added at the top of the CQL file
    const ruleValueset = rule.valueset as { name?: string; oid?: string } | undefined;
    if (ruleValueset) {
      ruleValueset.name = `${(ruleValueset.name || '').replace(/"/g, '\\"')} VS`;
      const count = getCountForUniqueExpressionName(
        ruleValueset as Record<string, unknown>,
        resourceMap,
        'name',
        'oid'
      );
      if (count > 0) {
        ruleValueset.name = `${ruleValueset.name}_${count}`;
      }
      resourceMap.set(ruleValueset.name || '', ruleValueset as Record<string, unknown>);
    }

    return ejs.render(ruleToRender, {
      ...rule,
      value_name,
      resourceProperty,
      typeSpecifier: typeSpecifier || {},
      codeNames
    });
  }

  // Conjunction at root level
  if (isRoot) {
    const alias = (queryAliasMap[inputType as keyof typeof queryAliasMap] as string) || 'ALIAS';
    const ruleRules = (rule.rules as Array<Record<string, unknown>> | undefined) || [];
    const statements = ruleRules
      .map((r: Record<string, unknown>) =>
        checkRules(r, alias, inputType, codeSystemMap, codeMap, conceptMap, resourceMap)
      )
      .filter((s): s is string => s !== undefined);
    return ejs.render(ruleMap['RootTemplate'], {
      value_name,
      alias,
      isFirstModifier,
      statements,
      conjunctionType: rule.conjunctionType
    });
  }

  // Conjunction within tree
  const ruleRules = (rule.rules as Array<Record<string, unknown>> | undefined) || [];
  const statements = ruleRules
    .map((r: Record<string, unknown>) =>
      checkRules(r, value_name, inputType, codeSystemMap, codeMap, conceptMap, resourceMap)
    )
    .filter((s): s is string => s !== undefined);
  return ejs.render(ruleMap['GroupTemplate'], { statements, conjunctionType: rule.conjunctionType });
}

// Both parameters are arrays. All modifiers will be applied to all values, and joined with "\n or".
function applyModifiers(
  this: {
    codeSystemMap: Map<string, { name: string; id: string }>;
    codeMap: Map<string, unknown>;
    conceptMap: Map<string, unknown>;
    resourceMap: Map<string, unknown>;
  },
  values: Array<string> = [],
  modifiers: Array<Record<string, unknown>> = []
): string {
  // default modifiers to []
  return values
    .map((value: string) => {
      let newValue = value;
      modifiers.forEach((modifier: Record<string, unknown>, index: number) => {
        // Is a modifier built in the query builder
        if (modifier.where) {
          // A query builder modifier will always have exactly one input type
          const inputType = ((modifier.inputTypes as Array<string>) || [])[0];
          if (inputType) {
            const checkRulesResult = checkRules(
              modifier.where as Record<string, unknown>,
              newValue,
              inputType,
              this.codeSystemMap,
              this.codeMap,
              this.conceptMap,
              this.resourceMap,
              true,
              index === 0
            );
            if (checkRulesResult) {
              newValue = checkRulesResult;
            }
          }
        } else {
          if (fhirTarget && fhirTarget.version && (fhirTarget.version as string).startsWith('1.0.')) {
            if (modifier.id === 'ActiveMedicationRequest') modifier.cqlLibraryFunction = 'C3F.ActiveMedicationOrder';
            if (modifier.id === 'LookBackMedicationRequest')
              modifier.cqlLibraryFunction = 'C3F.MedicationOrderLookBack';
          }
          const modValsWithTemplate = modifier.values as { templateName?: string } | undefined;
          if (!modifier.cqlLibraryFunction && modValsWithTemplate && modValsWithTemplate.templateName) {
            modifier.cqlLibraryFunction = modValsWithTemplate.templateName;
          }
          let modifierContext: Record<string, unknown> = {
            cqlLibraryFunction: modifier.cqlLibraryFunction,
            value_name: newValue,
            values: { value: null as unknown }
          };
          if (modifier.values && modifier.type === 'ExternalModifier') {
            const modVals = modifier.values as { value?: Array<Record<string, unknown>> };
            if (modVals.value) {
              modVals.value.forEach((value: Record<string, unknown>) => {
                let system = (_.get(value, 'system', '') as string).replace(/'/g, "\\'");
                let uri = (_.get(value, 'uri', '') as string).replace(/'/g, "\\'");
                if (system && uri) {
                  this.codeSystemMap.set(system, { name: system, id: uri });
                }
              });
            }
          }
          // Modifiers that add new value sets, will have a valueSet attribute on values.
          const modifierValues = modifier.values as
            | {
                valueSet?: { name: string };
                code?: Record<string, unknown>;
                unit?: string;
                value?: Array<Record<string, unknown>>;
              }
            | undefined;
          if (modifierValues && modifierValues.valueSet) {
            modifierValues.valueSet.name = `${modifierValues.valueSet.name.replace(/"/g, '\\"')} VS`;
            // Add the value set to the resourceMap to be included and referenced
            const count = getCountForUniqueExpressionName(modifierValues.valueSet, this.resourceMap, 'name', 'oid');
            if (count > 0) {
              modifierValues.valueSet.name = `${modifierValues.valueSet.name}_${count}`;
            }
            modifier.cqlTemplate = 'CheckInclusionInVS';
          }
          if (modifierValues && modifierValues.code) {
            let concepts: Array<Record<string, unknown>> = [];
            buildConceptObjectForCodes([modifierValues.code], concepts);
            concepts.forEach(concept => {
              modifierValues.code = addConcepts(concept, this.codeSystemMap, this.codeMap, this.conceptMap) as Record<
                string,
                unknown
              >;
            });
            modifier.cqlTemplate = 'CheckEquivalenceToCode';
          }
          if (modifierValues) {
            if (modifierValues.unit) modifierValues.unit = modifierValues.unit.replace(/'/g, "\\'");
            if (modifierValues.value && Array.isArray(modifierValues.value)) {
              const codeSystemMap = this.codeSystemMap;
              modifierContext.values = {
                value: modifierValues.value.map((value: Record<string, unknown>, index: number) => {
                  if (index === 0) return null;
                  if (value && value.argSource && value.selected) {
                    if (value.argSource === 'editor' && value.type) {
                      return getCQLValueString(value, codeSystemMap);
                    } else if (value.argSource === 'parameter' && value.elementName) {
                      return { ...value, str: `"${value.elementName}"` };
                    } else if (value.argSource === 'baseElement' && value.elementName) {
                      return { ...value, str: `"${value.elementName}"` };
                    } else if (value.argSource === 'externalCql' && value.elementName && value.elementType) {
                      return value.elementType === 'function' ? `${value.elementName}()` : value.elementName;
                    }
                  }
                  return null;
                })
              };
            } else modifierContext.values = modifierValues as { value: unknown };
          }
          const cqlTemplate = (modifier.cqlTemplate as string) || '';
          if (!(cqlTemplate in modifierMap)) {
            console.error(`Modifier Template could not be found: ${cqlTemplate}`);
          }
          newValue = ejs.render(modifierMap[cqlTemplate], modifierContext);
        }
      });
      return newValue;
    })
    .join('\n  or '); // consider using '\t' instead of spaces if desired
}

function constructOneRecommendationConditional(recommendation: Record<string, unknown>, _text: unknown): string {
  const conjunction = 'and'; // possible that this may become `or`, or some combo of the two conjunctions
  let conditionalText: string;
  if (!_.isEmpty(recommendation.subpopulations)) {
    conditionalText = ((recommendation.subpopulations as Array<Record<string, unknown>>) || [])
      .map((subpopulation: Record<string, unknown>) => {
        if (subpopulation.special_subpopulationName) {
          return subpopulation.special_subpopulationName;
        }
        return subpopulation.subpopulationName ? `"${subpopulation.subpopulationName}"` : `"${subpopulation.uniqueId}"`;
      })
      .join(` ${conjunction} `);
  } else {
    conditionalText = '"InPopulation"'; // TODO: Is there a better way than hard-coding this?
  }
  return `if ${conditionalText} then `;
}

function constructLinks(links: Array<Record<string, unknown>>): string {
  let linksText = '';
  if (!_.isEmpty(links)) {
    linksText = 'List{ ';
    linksText += links
      .map((link: Record<string, unknown>) => {
        return (
          '{ label: ' +
          (link.label ? `'${sanitizeCQLString(link.label as string)}'` : "'Link'") +
          ', url: ' +
          (link.url ? `'${sanitizeCQLString(link.url as string)}'` : "'#'") +
          ', type: ' +
          (link.type ? `'${link.type as string}'` : "'absolute'") +
          ' }'
        );
      })
      .join(', ')
      .concat(' }');
  }
  return linksText;
}

function constructComment(comment: unknown): string {
  let commentText = '';
  if (!_.isEmpty(comment)) {
    const commentString = typeof comment === 'string' ? comment : String(comment);
    commentText = commentString.split('\n').join('\n  //');
  }
  return commentText;
}
/**
 * Checks a map to see if an identical expression is being added. Adds new expressions with a unique name.
 *
 * @param {Object} expression The expression to add to the map, and subsequently the CQL.
 * @param {Map} map The map to add the expression to.
 * @param {string} nameKey The key of the expression object to check for a unique expression name.
 * @param {string} contentKey The key of the expression object that provides the content of an expression, used to
 * decide if the expression is indeed unique.
 * @return {number} The number that was appended to the expression if it was not unique.
 */
function getCountForUniqueExpressionName(
  expression: Record<string, unknown>,
  map: Map<string, unknown>,
  nameKey: string,
  contentKey: string,
  checkContent = true
): number {
  if (map.size > 0) {
    let newOID = true;
    let count = 0;
    let existingOID = 0;
    map.forEach((val: unknown, key: string) => {
      if (!key) return;
      const baseKeyArray = key.split('_');
      // Check if the last entry is a number, meaning _n was appended to account for nonunique expression names.
      const lastChar = baseKeyArray[baseKeyArray.length - 1];
      if (baseKeyArray.length > 1 && Number.isInteger(parseInt(lastChar))) {
        baseKeyArray.pop();
      }
      const baseKeyString = baseKeyArray.join('_'); // The original expression name
      if (_.isEqual(baseKeyString, expression[nameKey])) {
        // If the name and content of the expressions are the same, the same expression is being used.
        // Don't add it to the CQL.
        const valRecord = val as Record<string, unknown>;
        if (checkContent && _.isEqual(valRecord[contentKey], expression[contentKey])) {
          newOID = false;
          existingOID = count;
        } else {
          // If the expression name has been used but the content is unique, increment the count to append to the name.
          count = count + 1;
        }
      }
    });
    if (newOID) {
      const cloneExpression = _.cloneDeep(expression);
      if (count > 0) {
        cloneExpression[nameKey] += `_${count}`;
      }
      map.set(cloneExpression[nameKey] as string, cloneExpression);
      return count;
    }
    return existingOID;
  } else {
    map.set(expression[nameKey] as string, expression);
    return 0;
  }
}

function addConcepts(
  concept: Record<string, unknown>,
  codeSystemMap: Map<string, { name: string; id: string }>,
  codeMap: Map<string, unknown>,
  conceptMap: Map<string, unknown>
): Record<string, unknown> {
  const conceptCodes = (concept.codes as Array<Record<string, unknown>>) || [];
  conceptCodes.forEach((code: Record<string, unknown>) => {
    // Add Code Systems
    const cs = code.codeSystem as { name: string; id: string };
    const codeSystemCount = getCountForUniqueExpressionName(cs, codeSystemMap, 'name', 'id');
    if (codeSystemCount > 0) {
      cs.name = `${cs.name}_${codeSystemCount}`;
    }

    // Add individual codes
    const codeCount = getCountForUniqueExpressionName(code, codeMap, 'name', 'codeSystem');
    if (codeCount > 0) {
      code.name = `${code.name as string}_${codeCount}`;
    }
  });

  if (conceptCodes.length !== 1) {
    // Only add concepts if more than one code in concept
    // Add concepts
    const conceptCount = getCountForUniqueExpressionName(concept, conceptMap, 'name', 'codes');
    if (conceptCount > 0) {
      concept.name = `${concept.name as string}_${conceptCount}`;
    }
  } else {
    // Make sure name referenced in later definitions is the code name, if only one code
    concept.name = conceptCodes[0].name;
  }

  return concept;
}

function buildConceptObjectForCodes(
  codes: Array<Record<string, unknown>> | undefined,
  listOfConcepts: Array<Record<string, unknown>>
): void {
  if (codes) {
    codes.forEach((code: Record<string, unknown>) => {
      const codeRecord = code as {
        code: string;
        display?: string;
        codeSystem?: { name?: string; id?: string };
        system?: string;
        uri?: string;
      };
      if (!codeRecord.display) codeRecord.display = '';
      codeRecord.code = codeRecord.code.replace(/'/g, "\\'").replace(/"/g, '\\"');
      codeRecord.display = codeRecord.display.replace(/'/g, "\\'");
      // Qualifier modifier editor flattens out the typical codeSystem, so handle both formats of codes
      const codeSystem = (codeRecord.codeSystem as { name?: string; id?: string } | undefined) || {};
      const system = codeSystem.name || codeRecord.system || '';
      const uri = codeSystem.id || codeRecord.uri || '';
      if (!codeRecord.codeSystem) {
        codeRecord.codeSystem = {};
      }
      codeRecord.codeSystem.id = uri.replace(/'/g, "\\'");
      codeRecord.codeSystem.name = system;
      // If the codeName variable is ever modified, make sure to update the templates
      // in api/src/data/cql/rules that use similar logic (such as codeConceptMatchesConcept)
      const codeDisplay = codeRecord.display || '';
      const codeName = codeDisplay && codeDisplay.length < 60 ? codeDisplay.replace(/"/g, '\\"') : codeRecord.code;
      const concept = {
        name: `${codeRecord.codeSystem.name} ${codeRecord.code} Concept`,
        codes: [
          {
            name: `${codeName} code`,
            code: codeRecord.code,
            codeSystem: { name: codeRecord.codeSystem.name || '', id: codeRecord.codeSystem.id || '' },
            display: codeDisplay === '' ? `${codeRecord.codeSystem.name} ${codeRecord.code} Display` : codeDisplay
          }
        ],
        display:
          codeDisplay === ''
            ? `${codeRecord.codeSystem.name} ${codeRecord.code} Concept Display`
            : `${codeDisplay} Concept Display`
      };
      listOfConcepts.push(concept);
    });
  }
}

function addValueSets(
  field: Record<string, unknown>,
  valueSetObject: Record<string, unknown>,
  attribute: string
): void {
  if (field && field.valueSets) {
    (valueSetObject[attribute] as Array<unknown>) = [];
    ((field.valueSets as Array<Record<string, unknown>>) || []).forEach((vs: Record<string, unknown>) => {
      const valueSetArray = valueSetObject[attribute] as Array<{ name: string; oid: string }>;
      valueSetArray.push({
        name: `${(vs.name as string).replace(/"/g, '\\"')} VS`,
        oid: vs.oid as string
      });
    });
  }
}

function objToZippedCql(req: AuthenticatedRequest, res: Response): void {
  objConvert(req, res, writeZip);
}

function objToViewableCql(req: AuthenticatedRequest, res: Response): void {
  objConvert(req, res, writeCql);
}

function objToELM(req: AuthenticatedRequest, res: Response): void {
  objConvert(req, res, validateELM);
}

function objConvert(
  req: AuthenticatedRequest,
  res: Response,
  callback: (
    artifact: unknown,
    artifactJson: Record<string, unknown>,
    externalLibs: Array<Record<string, unknown>>,
    includeCQL: boolean,
    writeStream:
      | (
          | { json: (data: Record<string, unknown>) => void }
          | ({
              attachment: (name: string) => void;
              on: (event: string, callback: () => void) => void;
            } & NodeJS.WritableStream)
        )
      | Response,
    errorCallback: (error?: Error | null) => void
  ) => void
): void {
  if (req.user == null) {
    sendUnauthorized(res);
    return;
  }
  const user = req.user.uid;
  const artifactId = req.body._id;
  const artifactFromRequest = req.body;
  const includeCQL = req.query['includeCQL'] === 'true';
  artifactFromRequest.externalLibs = [];
  const externalLibs: Array<Record<string, unknown>> = [];
  // Add all external libraries
  CQLLibrary.find({ user: user, linkedArtifactId: { $ne: null, $eq: artifactId } })
    .exec()
    .then(libraries => {
      libraries.forEach(lib => {
        artifactFromRequest.externalLibs.push({
          name: lib.name,
          version: lib.version,
          alias: ''
        });
        const libJson = {
          filename: `${lib.name}`,
          version: lib.version,
          text: (lib.details?.cqlFileText as string) || '',
          type: 'text/plain'
        };
        externalLibs.push(libJson);
      });
      const artifact = new CqlArtifact(artifactFromRequest);
      artifact._id = artifactId;
      const artifactJson = artifact.toJson();

      // Merge the artifact with the commons and conversions libraries
      const fhirVersion = artifact.dataModel?.version || '4.0.1';
      const helperPath = path.join(__dirname, `../data/library_helpers/CQLFiles/${fhirVersion}`);
      const commonsPath = path.join(
        helperPath,
        `AT_Internal_CDS_Connect_Commons_for_FHIRv${fhirVersion.replace(/\./g, '')}.cql`
      );
      const conversionsPath = path.join(helperPath, 'AT_Internal_CDS_Connect_Conversions.cql');
      const artifactRaw = new RawCQL(artifactJson.text);
      const commonsRaw = new RawCQL(fs.readFileSync(commonsPath, 'utf-8'));
      const conversionsRaw = new RawCQL(fs.readFileSync(conversionsPath, 'utf-8'));
      const libraryGroup = importCQL(artifactRaw, [commonsRaw, conversionsRaw]);
      // Reassigning the text field of the artifactJson is safe, since it makes no
      // changes to the original CqlArtifact instance, and no other fields in the
      // artifactJson are affected by the merge operation here.
      artifactJson.text = exportCQL(libraryGroup);

      // Attempt to reformat the primary CQL library if CQL Formatter is active
      if (config.get('cqlFormatter.active')) {
        // NOTE: using formatCQL function directly
        formatCQL(artifactJson.text, (err, formattedCQL) => {
          // Sanity check: only replace the CQL if no errors and it starts with "library";
          // Otherwise just ignore the error since formatting isn't critical.
          if (err == null && formattedCQL != null && /^library/.test(formattedCQL)) {
            artifactJson.text = formattedCQL;
          }
          callback(artifact, artifactJson, externalLibs, includeCQL, res, (err?: Error | null) => {
            if (err) {
              res.status(500).send({ error: err.message });
            }
          });
        });
      } else {
        // Skip reformatting the CQL
        callback(artifact, artifactJson, externalLibs, includeCQL, res, (err?: Error | null) => {
          if (err) {
            res.status(500).send({ error: err.message });
          }
        });
      }
    })
    .catch(err => {
      res.status(500).send({ error: err.message });
    });
}

// While the artifact argument is not used, it's required because the callback
// that calls this function requires that argument to be present
function validateELM(
  artifact: unknown,
  artifactJson: Record<string, unknown>,
  externalLibs: Array<Record<string, unknown>>,
  includeCQL: boolean,
  writeStream: unknown,
  callback: (error?: Error | null) => void
): void {
  const typedWriteStream = writeStream as { json: (data: Record<string, unknown>) => void };
  const artifacts = [artifactJson, ...externalLibs];
  const artifactDataModel = (artifact as { dataModel?: { version?: string } })?.dataModel;
  const fhirVersionForElm = artifactDataModel?.version || '4.0.1';
  convertToElm(
    artifacts,
    false,
    (err: Error | null, elmFiles?: Array<Record<string, unknown>>) => {
      if (err) {
        callback(err);
        return;
      }
      let elmErrors: Array<unknown> = [];
      const typedElmFiles = (elmFiles || []) as Array<{ name: string; content: string }>;
      typedElmFiles.forEach((e: { name: string; content: string }) => {
        const annotations = JSON.parse(e.content).library.annotation;
        if (Array.isArray(annotations)) {
          // Only return true errors (not warnings)
          const fileErrors = annotations.filter((a: { errorSeverity: string }) => a.errorSeverity === 'error');
          if (fileErrors.length) {
            elmErrors = elmErrors.concat(fileErrors);
          }
        }
      });
      if (includeCQL) {
        // Include CQL text along with the ELM
        // TODO: Also include any libraries
        let cqlFiles = artifacts.map((artifact: Record<string, unknown>) => {
          return { name: (artifact.name || artifact.filename) as string, text: artifact.text as string };
        });
        typedWriteStream.json({ elmFiles, elmErrors, cqlFiles });
      } else {
        typedWriteStream.json({ elmFiles, elmErrors });
      }
    },
    fhirVersionForElm
  );
}

//given a CQLArtifact, find the associated Artifact in the DB, convert it to a CPG Publishable Library
async function convertToCPGPL(
  cqlArtifact: Record<string, unknown>,
  cqlText: string
): Promise<string | { error: unknown }> {
  try {
    const artifact = await Artifact.findOne({ _id: { $ne: null, $eq: cqlArtifact._id } }).exec();
    if (!artifact) {
      return { error: 'Artifact not found' };
    }
    let cpg = artifact.toPublishableLibrary();
    let cqlBuffer = Buffer.from(cqlText);
    cpg['content'] = [
      {
        contentType: 'application/cql',
        data: cqlBuffer.toString('base64')
      }
    ];
    return JSON.stringify(cpg, null, 2);
  } catch (err) {
    return { error: err };
  }
}

// Note: This callback ignores an argument (via a _ placeholder) specifying whether CQL should be included
// since it always includes CQL
function writeZip(
  artifact: unknown,
  artifactJson: Record<string, unknown>,
  externalLibs: Array<Record<string, unknown>>,
  _: unknown,
  writeStream: unknown,
  callback: (error?: Error | null) => void
): void {
  const typedWriteStream = writeStream as {
    attachment: (name: string) => void;
    on: (event: string, callback: () => void) => void;
  } & NodeJS.WritableStream;
  const artifacts = [artifactJson, ...externalLibs];
  // convert the artifact to a CPG Publishable Library, passing in the text directly (since it was likely modified)
  convertToCPGPL(artifact as Record<string, unknown>, artifactJson.text as string).then(function (cpgString) {
    // We must first convert to ELM before packaging up
    const artifactDataModel = (artifact as { dataModel?: { version?: string } }).dataModel;
    const fhirVersionForElm = artifactDataModel?.version || '4.0.1';
    convertToElm(
      artifacts,
      true,
      (err: Error | null, elmFiles?: Array<Record<string, unknown>>) => {
        if (err) {
          callback(err);
          return;
        }
        // Now build the zip, piping it to the writestream
        typedWriteStream.attachment('archive-name.zip');
        const archive = archiver('zip', { zlib: { level: 9 } }).on('error', callback);
        typedWriteStream.on('close', callback);
        archive.pipe(typedWriteStream);

        externalLibs.forEach((externalLib: Record<string, unknown>) => {
          archive.append((externalLib.text as string) || '', {
            name: `${externalLib.filename as string}.cql`
          });
        });
        if (typeof cpgString === 'string') {
          archive.append(cpgString, {
            name: `Library-${artifactJson.filename as string}.json`
          });
        } else {
          console.log('Error with CPG Publishable library: ' + (cpgString as { error?: unknown }).error);
        }
        archive.append((artifactJson.text as string) || '', {
          name: `${artifactJson.filename as string}.cql`
        });
        if (elmFiles) {
          (elmFiles as Array<{ name: string; content: string }>).forEach((e: { name: string; content: string }) => {
            archive.append(e.content.replace(/\r\n|\r|\n/g, '\r\n'), {
              name: e.content.startsWith('<') ? `${e.name}.xml` : `${e.name}.json`
            });
          });
        }

        const artifactDataModel = (artifact as { dataModel?: { version?: string } }).dataModel;
        const fhirVersion = artifactDataModel?.version || '4.0.1';
        const helperPathForArchive = path.join(__dirname, `../data/library_helpers/CQLFiles/${fhirVersion}`);
        archive.glob('FHIRHelpers.cql', { cwd: helperPathForArchive });
        archive.finalize();
      },
      fhirVersionForElm
    );
  });
}

// Note: This callback ignores an argument (via a _ placeholder) specifying whether CQL should be included
// since it always includes CQL
function writeCql(
  _artifact: unknown,
  artifactJson: Record<string, unknown>,
  externalLibs: Array<Record<string, unknown>>,
  _: unknown,
  writeStream: unknown,
  _callback: (error?: Error | null) => void
): void {
  const typedWriteStream = writeStream as { json: (data: Record<string, unknown>) => void };
  const artifacts = [artifactJson, ...externalLibs];
  let cqlFiles = artifacts.map((artifact: Record<string, unknown>) => {
    return { name: (artifact.name || artifact.filename) as string, text: artifact.text as string };
  });
  typedWriteStream.json({ cqlFiles });
}

function convertToElm(
  artifacts: Array<Record<string, unknown>>,
  getXML: boolean,
  callback: (error: Error | null, elmFiles?: Array<Record<string, unknown>>) => void,
  fhirVersion?: string
): void {
  // If CQL-to-ELM is disabled, this function should basically be a no-op
  if (!config.get('cqlToElm.active')) {
    callback(null, []);
    return;
  }

  // Load all the supplementary CQL files, open file streams to them, and convert to ELM
  const version = fhirVersion || fhirTarget?.version || '4.0.1';
  const helperPath = path.join(__dirname, `../data/library_helpers/CQLFiles/${version}`);
  const fileStream = fs.createReadStream(`${helperPath}/FHIRHelpers.cql`);
  // NOTE: using makeCQLtoELMRequest function directly
  makeCQLtoELMRequest(
    artifacts as Array<{ filename: string; text: string; type: string }>,
    [fileStream],
    getXML,
    callback
  );
}

function makeCQLtoELMRequest(
  files: Array<{ filename: string; text: string; type: string }> | null,
  fileStreams: Array<{ path: string | Buffer }> | null,
  getXML: boolean,
  callback: (error: Error | null, elmFiles?: Array<Record<string, unknown>>) => void
): void {
  // Request endpoint query parameters are being updated according to CPG guidance
  // http://hl7.org/fhir/uv/cpg/STU1/libraries.html#translation-to-elm
  const requestParams = [
    'annotations=true',
    'locators=true',
    'disable-list-demotion=true',
    'disable-list-promotion=true',
    'disable-method-invocation=true',
    'date-range-optimization=true',
    'result-types=true',
    'detailed-errors=false',
    'disable-list-traversal=false',
    'signatures=All'
  ];
  const url = `${config.get('cqlToElm.url')}?${requestParams.join('&')}`;
  const options: { headers?: Record<string, string> } = {};
  if (getXML) {
    options.headers = {
      'X-TargetFormat': 'application/elm+json,application/elm+xml'
    };
  }
  const form = new FormData();
  if (files) {
    files.forEach(file => {
      form.append(file.filename, file.text, {
        filename: file.filename,
        contentType: file.type
      });
    });
  }
  if (fileStreams) {
    fileStreams.forEach(f => {
      const filePath = typeof f.path === 'string' ? f.path : f.path.toString();
      form.append(path.basename(filePath, '.cql'), f);
    });
  }

  axios
    .post(url, form, options)
    .then(res => {
      const contentType = res.headers['Content-Type'] || res.headers['content-type'];
      // The body is multi-part containing an ELM file in each part, so we need to split it
      splitELM(res.data, contentType, callback);
    })
    .catch(err => {
      if (err.response?.status && err.response.status !== 200 && err.response.data) {
        callback(new Error(err.response.data));
      } else {
        callback(err);
      }
    });
}

function splitELM(
  body: unknown,
  contentType: string,
  callback: (error: Error | null, elmFiles?: Array<Record<string, unknown>>) => void
): void {
  // Because ELM comes back as a multipart response we use busboy to split it up
  const elmFiles: Array<{ name: string; content: string }> = [];

  let bb;
  try {
    bb = busboy({ headers: { 'content-type': contentType } });
  } catch (err) {
    callback(err as Error);
    return;
  }
  bb.on('field', (fieldname: string, val: string) => {
    elmFiles.push({ name: fieldname, content: val });
  })
    .on('finish', () => {
      callback(null, elmFiles);
    })
    .on('error', (err: unknown) => {
      callback(err as Error);
    });
  bb.end(body);
}

function formatCQL(cqlText: string, callback: (error: Error | null, formatted?: string) => void): void {
  const url = config.get('cqlFormatter.url');
  const options = {
    headers: { 'Content-Type': 'application/cql', Accept: 'application/cql' }
  };

  axios
    .post(url, cqlText, options)
    .then(res => {
      callback(null, res.data);
    })
    .catch(err => {
      if (err.response?.status && err.response.status !== 200 && err.response.data) {
        callback(new Error(err.response.data));
      } else {
        callback(err);
      }
    });
}

function buildCQL(artifactBody: ArtifactStructure): CqlArtifact {
  return new CqlArtifact(artifactBody);
}

export { makeCQLtoELMRequest };
export default {
  makeCQLtoELMRequest,
  buildCQL,
  objToZippedCql,
  objToViewableCql,
  objToELM,
  objConvert,
  formatCQL
};
