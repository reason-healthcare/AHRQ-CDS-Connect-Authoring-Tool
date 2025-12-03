import fs from 'fs';
import _ from 'lodash';
import mongoose, { Document, Schema } from 'mongoose';
import fhir4 from 'fhir/r4';

import codeSystems from '../data/codeSystems.js';
import contextMappings from '../data/contextMappings.js';

// Import JSON files from frontend using fs.readFileSync
const nuccProviderTaxonomy = JSON.parse(
  fs.readFileSync(new URL('../../../frontend/src/data/nuccProviderTaxonomyV20.0.json', import.meta.url), 'utf-8')
) as Array<{ Code: string; Classification: string; Specialization?: string }>; // http://nucc.org/
const fhirWorkflowTaskCodes = JSON.parse(
  fs.readFileSync(new URL('../../../frontend/src/data/fhirWorkflowTaskCodesV3.json', import.meta.url), 'utf-8')
) as Array<{ Code: string; Display: string }>; // https://terminology.hl7.org/1.0.0/ValueSet-v3-ActTaskCode.html
const fhirClinicalVenueCodes = JSON.parse(
  fs.readFileSync(new URL('../../../frontend/src/data/fhirClinicalVenueCodesV3.json', import.meta.url), 'utf-8')
) as Array<{ Code: string; Display: string }>; // https://terminology.hl7.org/1.0.0/ValueSet-v3-ServiceDeliveryLocationRoleType.html

export interface IArtifact extends Document {
  name?: string;
  version?: string;
  description?: string;
  url?: string;
  status?: string;
  experimental?: boolean;
  publisher?: string;
  context?: Array<Record<string, unknown>>;
  purpose?: string;
  usage?: string;
  copyright?: string;
  approvalDate?: Date;
  lastReviewDate?: Date;
  effectivePeriod?: {
    start?: Date;
    end?: Date;
  };
  topic?: Array<{ system: string; code: string; other?: string }>;
  author?: Array<Record<string, unknown>>;
  reviewer?: Array<Record<string, unknown>>;
  endorser?: Array<Record<string, unknown>>;
  relatedArtifact?: Array<Record<string, unknown>>;
  strengthOfRecommendation?: {
    strengthOfRecommendation?: string;
    system?: string;
    code?: string;
    other?: string;
  };
  qualityOfEvidence?: {
    qualityOfEvidence?: string;
    system?: string;
    code?: string;
    other?: string;
  };
  fhirVersion?: string;
  expTreeInclude?: Record<string, unknown>;
  expTreeExclude?: Record<string, unknown>;
  recommendations?: Array<unknown>;
  subpopulations?: Array<unknown>;
  baseElements?: Array<unknown>;
  parameters?: Array<unknown>;
  errorStatement?: Record<string, unknown>;
  user?: string;
  createdAt?: Date;
  updatedAt?: Date;
  toPublishableLibrary(): fhir4.Library;
  mapContact(contactType: string): Array<{ name: string }> | undefined;
  convertContext(): Array<fhir4.UsageContext | Record<string, unknown>> | undefined;
}

const ArtifactSchema = new Schema<IArtifact>(
  {
    name: String,
    version: String,
    description: String,
    url: String,
    status: String,
    experimental: Boolean,
    publisher: String,
    context: Array,
    purpose: String,
    usage: String,
    copyright: String,
    approvalDate: Date,
    lastReviewDate: Date,
    effectivePeriod: {
      start: Date,
      end: Date
    },
    topic: Array,
    author: Array,
    reviewer: Array,
    endorser: Array,
    relatedArtifact: Array,
    strengthOfRecommendation: Object,
    qualityOfEvidence: Object,
    fhirVersion: String,
    expTreeInclude: Object,
    expTreeExclude: Object,
    recommendations: Array,
    subpopulations: Array,
    baseElements: Array,
    parameters: Array,
    errorStatement: Object,
    user: { type: String, immutable: true }
  },
  {
    timestamps: true // adds created_at, updated_at
  }
);

//Convert the schema into an CPG Publishable Library JSON object
ArtifactSchema.methods.toPublishableLibrary = function (): fhir4.Library {
  //the ultimate value to return
  const retVal: Record<string, unknown> = {};

  retVal['resourceType'] = 'Library';

  //handle the extensions
  if (
    (this.strengthOfRecommendation && this.strengthOfRecommendation.strengthOfRecommendation) ||
    (this.qualityOfEvidence && this.qualityOfEvidence.qualityOfEvidence)
  ) {
    retVal['extension'] = [];
    if (this.strengthOfRecommendation && this.strengthOfRecommendation.strengthOfRecommendation) {
      (retVal['extension'] as Array<unknown>).push({
        url: 'http://hl7.org/fhir/StructureDefinition/cqf-strengthOfRecommendation',
        valueCodeableConcept: {
          coding: [
            this.strengthOfRecommendation.strengthOfRecommendation === 'other'
              ? {
                  system:
                    this.strengthOfRecommendation.system !== 'Other'
                      ? codeSystems.find(x => x.value === this.strengthOfRecommendation.system)?.['id']
                      : this.strengthOfRecommendation.other,
                  code: this.strengthOfRecommendation.code
                }
              : {
                  system: 'http://terminology.hl7.org/CodeSystem/recommendation-strength',
                  code: this.strengthOfRecommendation.strengthOfRecommendation
                }
          ]
        }
      });
    }
    if (this.qualityOfEvidence && this.qualityOfEvidence.qualityOfEvidence) {
      (retVal['extension'] as Array<unknown>).push({
        url: 'http://hl7.org/fhir/StructureDefinition/cqf-qualityOfEvidence',
        valueCodeableConcept: {
          coding: [
            this.qualityOfEvidence.qualityOfEvidence === 'other'
              ? {
                  system:
                    this.qualityOfEvidence.system !== 'Other'
                      ? codeSystems.find(x => x.value === this.qualityOfEvidence.system)?.['id']
                      : this.qualityOfEvidence.other,
                  code: this.qualityOfEvidence.code
                }
              : {
                  system: 'http://terminology.hl7.org/CodeSystem/evidence-quality',
                  code: this.qualityOfEvidence.qualityOfEvidence
                }
          ]
        }
      });
    }
  }

  retVal['type'] = {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/library-type',
        code: 'logic-library',
        display: 'Logic Library'
      }
    ]
  };

  //name should be machine readable
  retVal['name'] = this.name.replace(/\s/g, '_');
  retVal['title'] = this.name;
  retVal['date'] = this.updatedAt;
  retVal['version'] = this.version;
  retVal['description'] = this.description;
  retVal['url'] = this.url;
  retVal['status'] = this.status || 'draft'; //default to draft, this field is _required_ by FHIR
  retVal['experimental'] = this['experimental'];
  retVal['publisher'] = this.publisher;
  retVal['useContext'] = this.convertContext();
  retVal['purpose'] = this.purpose;

  //date fields SHALL NOT have a time according to the Publishable Library spec
  if (this.approvalDate) {
    retVal['approvalDate'] = this.approvalDate.toISOString().split('T')[0];
  }
  if (this.lastReviewDate) {
    retVal['lastReviewDate'] = this.lastReviewDate.toISOString().split('T')[0];
  }
  //handle the effective period, which SHALL NOT have time as per the spec (similar to date fields above)
  if (this.effectivePeriod && !_.isMatch(this.effectivePeriod, {})) {
    retVal['effectivePeriod'] = {};
    if (this.effectivePeriod?.start) {
      (retVal['effectivePeriod'] as Record<string, unknown>)['start'] = this.effectivePeriod.start
        .toISOString()
        .split('T')[0];
    }
    if (this.effectivePeriod?.end) {
      (retVal['effectivePeriod'] as Record<string, unknown>)['end'] = this.effectivePeriod.end
        .toISOString()
        .split('T')[0];
    }
  }
  //handle the topic as a CodeableConcept
  if (this.topic && this.topic.length > 0) {
    //filter any null input
    retVal['topic'] = this.topic
      .filter(function (t: { system: string; code: string; other?: string }) {
        return !(t.system === null);
      })
      .map(function (t: { system: string; code: string; other?: string }) {
        return {
          coding: [
            {
              system: t.system !== 'Other' ? codeSystems.find(x => x.value === t.system)?.['id'] : t.other,
              code: t.code
            }
          ]
        };
      });
    //if its empty, remove it
    _.isEmpty(retVal['topic']) && delete retVal['topic'];
  }

  const contactFields = ['author', 'reviewer', 'endorser', 'editor'];
  //map the contacts, remove any empty lists
  contactFields.forEach(field => {
    retVal[field] = this.mapContact(field);
    _.isEmpty(retVal[field]) && delete retVal[field];
  });

  //map the related artifacts
  if (this.relatedArtifact && this.relatedArtifact.length > 0) {
    //remove any null fields
    retVal['relatedArtifact'] = this.relatedArtifact
      .filter(function (artifact: Record<string, unknown>) {
        return !(artifact['relatedArtifactType'] === null);
      })
      .map(function (artifact: Record<string, unknown>) {
        return {
          type: artifact['relatedArtifactType'],
          display: artifact['description'],
          url: artifact['url'],
          citation: artifact['citation']
        };
      });
    _.isEmpty(retVal['relatedArtifact']) && delete retVal['relatedArtifact'];
  }

  //remove any fields that have empty/null/undefined values
  //modified from: https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
  const removeEmpty = (obj: Record<string, unknown>): void => {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        removeEmpty(obj[key] as Record<string, unknown>);
      }
      // recurse
      else if (_.isEmpty(obj[key]) || _.isUndefined(obj[key]) || _.isNull(obj[key])) {
        delete obj[key];
      }
    });
  };
  removeEmpty(retVal);
  return retVal as unknown as fhir4.Library;
};

//helper function to map contacts into CPG form.  used by toPublishableLibrary()
ArtifactSchema.methods.mapContact = function (contactType: string): Array<{ name: string }> | undefined {
  if (this[contactType] && this[contactType].length > 0) {
    //remove any empty string contacts, then map the contacts
    return this[contactType]
      .filter(function (ct: Record<string, unknown>) {
        return ct[contactType] !== '';
      })
      .map(function (contact: Record<string, unknown>): { name: string } | undefined {
        if (contact[contactType] !== '') {
          return { name: contact[contactType] as string };
        }
        return undefined;
      })
      .filter((item: { name: string } | undefined): item is { name: string } => item !== undefined);
  }
  return undefined;
};

//Handling context can be gnarly, so we're separating that into its own function
ArtifactSchema.methods.convertContext = function (): Array<fhir4.UsageContext> | undefined {
  if (this.context && this.context.length > 0) {
    const result = this.context;
    //filter out invalid inputs
    return this.context
      .filter(function (ctx: Record<string, unknown>) {
        return !(
          ctx[ctx['contextType'] as string] === null ||
          ctx['program'] === '' ||
          ctx['system'] === null ||
          ctx['ageRangeUnitOfTime'] === null
        );
      })
      .map(function (context: Record<string, unknown>) {
        const type = context['contextType'] as string;
        const ctxMap = contextMappings.find((x: { type: string }) => x.type === type);
        //the object we'll build into CPG format
        let tmpCtx: Record<string, unknown> = {};
        let code: string,
          tax: { Code: string; Classification: string; Specialization?: string },
          display: string,
          workflowDef: { Code: string; Display: string },
          venueDef: { Code: string; Display: string };
        switch (type) {
          case 'ageRange':
            tmpCtx = {
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: 'age'
              },
              valueRange: {
                low: {
                  value: new Number(context['ageRangeMin']),
                  unit: context['ageRangeUnitOfTime'],
                  system: 'http://unitsofmeasure.org',
                  code: (ctxMap as { codes: Record<string, string> })['codes'][context['ageRangeUnitOfTime'] as string]
                },
                high: {
                  value: new Number(context['ageRangeMax']),
                  unit: context['ageRangeUnitOfTime'],
                  system: 'http://unitsofmeasure.org',
                  code: (ctxMap as { codes: Record<string, string> })['codes'][context['ageRangeUnitOfTime'] as string]
                }
              }
            };
            break;
          case 'clinicalFocus':
            tmpCtx = {
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: 'focus'
              },
              valueCodeableConcept: {
                coding: [
                  {
                    system:
                      context['system'] !== 'Other'
                        ? codeSystems.find(x => x.value === context['system'])?.id
                        : (context['other'] as string),
                    code: context['code'] as string
                  }
                ]
              }
            };
            break;
          case 'userType':
            code = (context['userType'] as string).split('user-')[1];
            const foundTax = _.find(nuccProviderTaxonomy, { Code: code }) as
              | { Code: string; Classification: string; Specialization?: string }
              | undefined;
            if (foundTax) {
              tax = foundTax;
              display = tax['Classification'] || '';
              if (!_.isEmpty(tax['Specialization'])) {
                display = tax['Specialization'] || '';
              }
            } else {
              display = '';
            }
            tmpCtx = {
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: 'user'
              },
              valueCodeableConcept: {
                coding: [
                  {
                    system: (ctxMap as { system: string })['system'],
                    code: code,
                    display: display
                  }
                ]
              }
            };
            break;
          case 'workflowSetting':
            code = context['workflowSetting'] as string;
            tmpCtx = {
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: 'workflow'
              },
              valueCodeableConcept: {
                coding: [
                  {
                    system: (ctxMap as { system: string })['system'],
                    code:
                      (ctxMap as unknown as Record<string, { code: string; display: string }>)[code]?.['code'] || '',
                    display:
                      (ctxMap as unknown as Record<string, { code: string; display: string }>)[code]?.['display'] || ''
                  }
                ]
              }
            };
            break;
          case 'workflowTask':
            code = context['workflowTask'] as string;
            workflowDef = _.find(fhirWorkflowTaskCodes, { Code: code }) as { Code: string; Display: string };
            tmpCtx = {
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: 'task'
              },
              valueCodeableConcept: {
                coding: [
                  {
                    system: (ctxMap as { system: string })['system'],
                    code: workflowDef['Code'],
                    display: workflowDef['Display']
                  }
                ]
              }
            };
            break;
          case 'clinicalVenue':
            code = context['clinicalVenue'] as string;
            venueDef = _.find(fhirClinicalVenueCodes, { Code: code }) as { Code: string; Display: string };
            tmpCtx = {
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: 'venue'
              },
              valueCodeableConcept: {
                coding: [
                  {
                    system: (ctxMap as { system: string })['system'],
                    code: venueDef['Code'],
                    display: venueDef['Display']
                  }
                ]
              }
            };
            break;
          case 'species':
            tmpCtx = {
              code: {
                code: 'species',
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type'
              },
              valueCodeableConcept: {
                coding: [
                  {
                    system:
                      context['system'] !== 'Other'
                        ? codeSystems.find(x => x.value === context['system'])?.id
                        : (context['other'] as string),
                    code: context['code'] as string
                  }
                ]
              }
            };
            break;
          case 'program':
            tmpCtx = {
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: 'program'
              },
              valueCodeableConcept: {
                text: context['program'] as string
              }
            };
            break;

          default:
            //default to CodeableConcept
            //as of right now, program maps to the default CodeableConcept format
            tmpCtx = {
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: type
              },
              valueCodeableConcept: {
                coding: [
                  {
                    system: (ctxMap as { system: string })['system'],
                    code:
                      (ctxMap as unknown as Record<string, { code: string; display: string }>)[
                        context[type] as string
                      ]?.['code'] || '',
                    display:
                      (ctxMap as unknown as Record<string, { code: string; display: string }>)[
                        context[type] as string
                      ]?.['display'] || ''
                  }
                ]
              }
            };
        }
        return tmpCtx as unknown as fhir4.UsageContext;
      });
    return result;
  }
  return undefined;
};

export default mongoose.model<IArtifact>('Artifact', ArtifactSchema);
