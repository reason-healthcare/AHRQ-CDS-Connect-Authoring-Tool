import { Request, Response } from 'express';
import Templates from '../data/formTemplates.js';
import ValueSets from '../data/valueSets.js';
import fs from 'fs';

// Import JSON files using fs.readFileSync
const conversionsELMFile = JSON.parse(
  fs.readFileSync(
    new URL('../data/library_helpers/ELMFiles/AT_Internal_CDS_Connect_Conversions.json', import.meta.url),
    'utf-8'
  )
) as {
  library: {
    statements: {
      def: Array<{ name: string }>;
    };
  };
};
const dstu2_resources = JSON.parse(
  fs.readFileSync(new URL('../data/query_builder/dstu2_resources.json', import.meta.url), 'utf-8')
) as Record<string, unknown>;
const stu3_resources = JSON.parse(
  fs.readFileSync(new URL('../data/query_builder/stu3_resources.json', import.meta.url), 'utf-8')
) as Record<string, unknown>;
const r4_resources = JSON.parse(
  fs.readFileSync(new URL('../data/query_builder/r4_resources.json', import.meta.url), 'utf-8')
) as Record<string, unknown>;
const operators = JSON.parse(
  fs.readFileSync(new URL('../data/query_builder/operators.json', import.meta.url), 'utf-8')
) as Record<string, unknown>;

const queryResources = {
  dstu2_resources,
  stu3_resources,
  r4_resources,
  operators
};

// If new functions are added to AT_Internal_CDS_Connect_Conversions and a separate description is desired,
// add a key value pair to the following object with the descripton: function_name : function_description
const conversionFunctionDescriptions: Record<string, string> = {
  to_mg_per_dL: 'mmol/L to mg/dL for blood cholesterol'
};

export default {
  getTemplates,
  getValueSets,
  getOneValueSet,
  getConversionFunctions,
  getDSTU2Resources,
  getSTU3Resources,
  getR4Resources,
  getResourceOperators
};

// Returns all ValueSets saved
function getTemplates(_request: Request, result: Response): void {
  result.json(Templates);
}

// Returns all ValueSets saved
function getValueSets(_request: Request, result: Response): void {
  result.json(ValueSets);
}

// Returns the nested ValueSet specified by the remaining path of the route
function getOneValueSet(request: Request, result: Response): void {
  // Gets the ValueSet category specified
  // let selectedObject = ValueSets[request.params.valueset];
  // console.log('selectedObject', selectedObject);
  // if (selectedObject === undefined) {
  //   result.status(404).send('This level of ValueSet does not exists');
  // }

  // Gets the nested ValueSet as deep as specified
  const path = request.params.valueset as string;
  // console.log('path', path);
  let selectedObject: unknown = ValueSets;
  for (let i = 0; i < path.length; i++) {
    const variable = path[i];
    if (variable !== '') {
      selectedObject = (selectedObject as Record<string, unknown>)[variable];
      if (selectedObject === undefined) {
        result.status(404).send('This level of ValueSet does not exist');
        return;
      }
    }
  }
  result.json(selectedObject);
}

function getConversionFunctions(_request: Request, result: Response): void {
  const definedExpressions = conversionsELMFile.library.statements.def;
  const convertFunctions = definedExpressions.map(def => {
    // If a description is not defined above, just use the function name
    let description = def.name;
    if (conversionFunctionDescriptions[def.name] !== undefined) {
      description = conversionFunctionDescriptions[def.name];
    }
    return { name: `Convert.${def.name}`, description };
  });
  result.json(convertFunctions);
}

function getDSTU2Resources(_request: Request, result: Response): void {
  result.json(queryResources['dstu2_resources']);
}

function getSTU3Resources(_request: Request, result: Response): void {
  result.json(queryResources['stu3_resources']);
}

function getR4Resources(_request: Request, result: Response): void {
  result.json(queryResources['r4_resources']);
}

function getResourceOperators(_request: Request, result: Response): void {
  result.json(queryResources['operators']);
}
