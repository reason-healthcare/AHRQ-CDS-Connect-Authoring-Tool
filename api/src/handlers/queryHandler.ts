import { Request, Response } from 'express';
import fs from 'fs';

// Import JSON files using fs.readFileSync
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

const queryResources: Record<string, Record<string, unknown>> = {
  dstu2_resources,
  stu3_resources,
  r4_resources,
  operators
};

function implicitConversionInfo(_req: Request, res: Response): void {
  const info = queryResources.operators.implicitConversionInfo as unknown;
  if (info) res.json(info);
  else res.status(404);
}

function operatorQuery(req: Request, res: Response): void {
  const acceptableTypes: string[] = [];
  const operatorArray = queryResources.operators.operators as Array<{
    primaryOperand: { typeSpecifier: string; elementTypes: string[] };
  }>;
  const [typeSpecifier, elementType] = [req.query.typeSpecifier as string, req.query.elementType as string];

  if (typeSpecifier && elementType) {
    acceptableTypes.push(elementType);
    acceptableTypes.push('System.Any');
    const filterArray = operatorArray.filter(obj => {
      return (
        obj.primaryOperand.typeSpecifier === typeSpecifier &&
        acceptableTypes.some(type => obj.primaryOperand.elementTypes.includes(type))
      );
    });
    if (filterArray.length) res.json(filterArray);
    else res.sendStatus(404);
  } else res.sendStatus(400);
}

function resourceQuery(req: Request, res: Response): void {
  const resourceName = req.params.resourceName as string;
  const resource = resourceSelector(req.query.fhirVersion as string);

  if (resourceName && resource) {
    const resourceData = resource as { resources: Array<{ name: string }> };
    const filterArray = resourceData.resources.filter(obj => {
      return obj.name === resourceName;
    });
    if (filterArray.length) res.json(filterArray);
    else res.sendStatus(404);
  } else res.sendStatus(400);
}

function resourceSelector(fhirVersion: string): Record<string, unknown> | '' {
  if (fhirVersion === '1.0.2') return queryResources.dstu2_resources;
  else if (fhirVersion === '3.0.0') return queryResources.stu3_resources;
  else if (/4\.0\.[01x]/.test(fhirVersion)) return queryResources.r4_resources;
  else return '';
}

export default {
  implicitConversionInfo,
  operatorQuery,
  resourceQuery
};
