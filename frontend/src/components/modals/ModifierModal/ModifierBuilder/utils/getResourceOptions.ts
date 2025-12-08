import { changeToCase } from 'utils/strings';
import _ from 'lodash';
import type { Resource } from '../../../../../types/query';
import type { ResourceOption } from '../../types';

interface TypeSpecifier {
  type: string;
  elementType?: Array<{ name: string; typeSpecifier: TypeSpecifier; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface ResourceProperty {
  name: string;
  typeSpecifier: TypeSpecifier;
  predefinedCodes?: string[];
  allowsCustomCodes?: boolean;
  [key: string]: unknown;
}

interface ResourceData {
  properties: ResourceProperty[];
  [key: string]: unknown;
}

// Type guard to check if resource data has properties
const isResourceData = (data: unknown): data is ResourceData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'properties' in data &&
    Array.isArray((data as { properties: unknown }).properties)
  );
};

const propertyToDropdownOption = (property: ResourceProperty): ResourceOption => {
  const dropdownOption: ResourceOption = {
    label: changeToCase(property.name, 'capitalCase'),
    value: property.name,
    typeSpecifier: property.typeSpecifier
  };

  if (property.predefinedCodes) {
    dropdownOption.predefinedCodes = property.predefinedCodes;
  }

  if (property.allowsCustomCodes) {
    dropdownOption.allowsCustomCodes = true;
  }
  return dropdownOption;
};

const resourceIsChoiceType = (resource: ResourceProperty): boolean => {
  return resource.typeSpecifier.type === 'ChoiceTypeSpecifier';
};

const sortResourceProperties = (properties: ResourceProperty[]): ResourceProperty[] => {
  return [...properties].sort((a, b) => {
    if (resourceIsChoiceType(a) && !resourceIsChoiceType(b)) return 1;
    else if (!resourceIsChoiceType(a) && resourceIsChoiceType(b)) return -1;
    else return a.name.localeCompare(b.name);
  });
};

const getResourceOptions = (resourceData: unknown): ResourceOption[] => {
  if (!isResourceData(resourceData)) return [];
  return _.flatMapDeep(sortResourceProperties(resourceData.properties), property => {
    if (resourceIsChoiceType(property)) {
      return [
        { ...propertyToDropdownOption(property), isSubheader: true },
        ...(property.typeSpecifier.elementType?.map(option => ({
          ...propertyToDropdownOption(option as ResourceProperty),
          labelPrefix: `${changeToCase(property.name, 'capitalCase')} | `
        })) ?? [])
      ];
    }

    return propertyToDropdownOption(property);
  });
};

export default getResourceOptions;
