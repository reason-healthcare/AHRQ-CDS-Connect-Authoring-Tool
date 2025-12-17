import pick from 'lodash/pick';

export interface ContextField {
  contextType: string;
  gender?: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  ageRangeUnitOfTime?: string;
  code?: string;
  system?: string;
  other?: string;
  userType?: string;
  workflowSetting?: string;
  workflowTask?: string;
  clinicalVenue?: string;
  program?: string;
}

interface CpgValues {
  description?: string;
  url?: string;
  status?: string;
  experimental?: boolean;
  publisher?: string;
  context?: ContextField[];
  purpose?: string;
  usage?: string;
  strengthOfRecommendation?: {
    strengthOfRecommendation?: string;
    code?: string;
    system?: string;
    other?: string;
  };
  qualityOfEvidence?: {
    qualityOfEvidence?: string;
    code?: string;
    system?: string;
    other?: string;
  };
  copyright?: string;
  approvalDate?: string;
  lastReviewDate?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  topic?: Array<{
    code?: string;
    system?: string;
    other?: string;
  }>;
  author?: Array<{ author?: string }>;
  reviewer?: Array<{ reviewer?: string }>;
  endorser?: Array<{ endorser?: string }>;
  relatedArtifact?: Array<{
    relatedArtifactType?: string;
    description?: string;
    url?: string;
    citation?: string;
  }>;
  name?: string;
  version?: string;
}

export function stripContextFields(contextFields: ContextField[]): ContextField[] {
  return contextFields
    .map(contextField => {
      const { contextType } = contextField;

      switch (contextType) {
        case 'gender':
          return pick(contextField, ['contextType', 'gender']) as ContextField;
        case 'ageRange':
          return pick(contextField, [
            'contextType',
            'ageRangeMin',
            'ageRangeMax',
            'ageRangeUnitOfTime'
          ]) as ContextField;
        case 'clinicalFocus':
        case 'species':
          return pick(contextField, ['contextType', 'code', 'system', 'other']) as ContextField;
        case 'userType':
          return pick(contextField, ['contextType', 'userType']) as ContextField;
        case 'workflowSetting':
          return pick(contextField, ['contextType', 'workflowSetting']) as ContextField;
        case 'workflowTask':
          return pick(contextField, ['contextType', 'workflowTask']) as ContextField;
        case 'clinicalVenue':
          return pick(contextField, ['contextType', 'clinicalVenue']) as ContextField;
        case 'program':
          return pick(contextField, ['contextType', 'program']) as ContextField;
        default:
          return null;
      }
    })
    .filter((field): field is ContextField => field !== null);
}

export function isCpgComplete(name: string, values: CpgValues): boolean {
  switch (name) {
    case 'description':
      return Boolean(values.description);
    case 'url':
      return Boolean(values.url);
    case 'status':
      return Boolean(values.status);
    case 'experimental':
      return Boolean(values.experimental);
    case 'publisher':
      return Boolean(values.publisher);
    case 'context':
      if (!values.context || values.context.length === 0) return false;
      const contextCpgCompletedFields = values.context.map(value => contextCpgComplete(value));
      return contextCpgCompletedFields.every(fieldComplete => fieldComplete);
    case 'purpose':
      return Boolean(values.purpose);
    case 'usage':
      return Boolean(values.usage);
    case 'strengthOfRecommendation':
      return values.strengthOfRecommendation?.strengthOfRecommendation === 'other'
        ? Boolean(
            values.strengthOfRecommendation.code &&
              values.strengthOfRecommendation.system &&
              (values.strengthOfRecommendation.system !== 'Other' || values.strengthOfRecommendation.other)
          )
        : Boolean(values.strengthOfRecommendation?.strengthOfRecommendation);
    case 'qualityOfEvidence':
      return values.qualityOfEvidence?.qualityOfEvidence === 'other'
        ? Boolean(
            values.qualityOfEvidence.code &&
              values.qualityOfEvidence.system &&
              (values.qualityOfEvidence.system !== 'Other' || values.qualityOfEvidence.other)
          )
        : Boolean(values.qualityOfEvidence?.qualityOfEvidence);
    case 'copyright':
      return Boolean(values.copyright);
    case 'approvalDate':
      return Boolean(values.approvalDate);
    case 'lastReviewDate':
      return Boolean(values.lastReviewDate);
    case 'effectivePeriod':
      return Boolean(values.effectivePeriod?.start || values.effectivePeriod?.end);
    case 'topic':
      if (!values.topic || values.topic.length === 0) return false;
      return values.topic.every(value =>
        Boolean(value.code && value.system && (value.system !== 'Other' || value.other))
      );
    case 'author':
      if (!values.author || values.author.length === 0) return false;
      return values.author.every(value => Boolean(value.author));
    case 'reviewer':
      if (!values.reviewer || values.reviewer.length === 0) return false;
      return values.reviewer.every(value => Boolean(value.reviewer));
    case 'endorser':
      if (!values.endorser || values.endorser.length === 0) return false;
      return values.endorser.every(value => Boolean(value.endorser));
    case 'relatedArtifact':
      if (!values.relatedArtifact || values.relatedArtifact.length === 0) return false;
      const relatedArtifactCpgCompletedFields = values.relatedArtifact.map(value => relatedArtifactCpgComplete(value));
      return relatedArtifactCpgCompletedFields.every(fieldComplete => fieldComplete);
    default:
      return false;
  }
}

export function getCpgCompleteCount(values: CpgValues): { cpgTotalCount: number; cpgCompleteCount: number } {
  let cpgTotalCount = 0;
  let cpgCompleteCount = 0;

  Object.keys(values).forEach(valueKey => {
    if (valueKey !== 'name' && valueKey !== 'version') cpgTotalCount += 1;
    if (isCpgComplete(valueKey, values)) cpgCompleteCount += 1;
  });

  return { cpgTotalCount, cpgCompleteCount };
}

function contextCpgComplete(values: ContextField): boolean {
  switch (values.contextType) {
    case 'gender':
      return Boolean(values.gender);
    case 'ageRange':
      return Boolean((values.ageRangeMin || values.ageRangeMax) && values.ageRangeUnitOfTime);
    case 'clinicalFocus':
    case 'species':
      return Boolean(values.code && values.system && (values.system !== 'Other' || values.other));
    case 'userType':
      return Boolean(values.userType);
    case 'workflowSetting':
      return Boolean(values.workflowSetting);
    case 'workflowTask':
      return Boolean(values.workflowTask);
    case 'clinicalVenue':
      return Boolean(values.clinicalVenue);
    case 'program':
      return Boolean(values.program);
    default:
      return false;
  }
}

function relatedArtifactCpgComplete(values: {
  relatedArtifactType?: string;
  description?: string;
  url?: string;
  citation?: string;
}): boolean {
  switch (values.relatedArtifactType) {
    case 'citation':
      return Boolean(values.description && values.url && values.citation);
    default:
      return false;
  }
}
