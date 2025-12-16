import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import type { Artifact } from '../../../types/artifact';
import type { ContextField } from '../../../utils/fields';

export interface ArtifactFormValues {
  name: string;
  version: string;
  description: string;
  url: string;
  status: string | null;
  experimental: string | null;
  publisher: string;
  context: ContextField[];
  purpose: string;
  usage: string;
  strengthOfRecommendation?: {
    strengthOfRecommendation: string | null;
    code: string;
    system: string;
    other: string;
  };
  qualityOfEvidence?: {
    qualityOfEvidence: string | null;
    code: string;
    system: string;
    other: string;
  };
  copyright: string;
  approvalDate: Date | null;
  lastReviewDate: Date | null;
  effectivePeriod: {
    start: Date | null;
    end: Date | null;
  };
  topic: Array<Record<string, unknown>>;
  author: Array<Record<string, unknown>>;
  reviewer: Array<Record<string, unknown>>;
  endorser: Array<Record<string, unknown>>;
  relatedArtifact: Array<Record<string, unknown>>;
}

function getInitialValue<T>(
  artifactEditing: Artifact | null | undefined,
  valueName: string,
  defaultValue: T,
  transformer: (value: unknown) => T = (x: unknown) => x as T
): T {
  if (!artifactEditing) return defaultValue;
  const artifactRecord = artifactEditing as Record<string, unknown>;
  if (artifactRecord[valueName] == null) return defaultValue;
  return transformer(artifactRecord[valueName]);
}

function stringToDateTransform(value: unknown): Date | null {
  if (value == null || typeof value !== 'string') return null;
  return parseISO(value);
}

const useInitialValues = (artifactEditing: Artifact | null | undefined): ArtifactFormValues =>
  useMemo(
    () => ({
      name: getInitialValue(artifactEditing, 'name', ''),
      version: getInitialValue(artifactEditing, 'version', ''),
      description: getInitialValue(artifactEditing, 'description', ''),
      url: getInitialValue(artifactEditing, 'url', ''),
      status: getInitialValue(artifactEditing, 'status', null),
      experimental: getInitialValue(artifactEditing, 'experimental', null, value => `${value}`),
      publisher: getInitialValue(artifactEditing, 'publisher', ''),
      context: getInitialValue(artifactEditing, 'context', []),
      purpose: getInitialValue(artifactEditing, 'purpose', ''),
      usage: getInitialValue(artifactEditing, 'usage', ''),
      strengthOfRecommendation: getInitialValue(artifactEditing, 'strengthOfRecommendation', {
        strengthOfRecommendation: null,
        code: '',
        system: '',
        other: ''
      }),
      qualityOfEvidence: getInitialValue(artifactEditing, 'qualityOfEvidence', {
        qualityOfEvidence: null,
        code: '',
        system: '',
        other: ''
      }),
      copyright: getInitialValue(artifactEditing, 'copyright', ''),
      approvalDate: getInitialValue(artifactEditing, 'approvalDate', null, stringToDateTransform),
      lastReviewDate: getInitialValue(artifactEditing, 'lastReviewDate', null, stringToDateTransform),
      effectivePeriod: getInitialValue(
        artifactEditing,
        'effectivePeriod',
        { start: null, end: null },
        (value: unknown) => {
          if (value && typeof value === 'object' && 'start' in value && 'end' in value) {
            return {
              start: stringToDateTransform(value.start),
              end: stringToDateTransform(value.end)
            };
          }
          return { start: null, end: null };
        }
      ),
      topic: getInitialValue(artifactEditing, 'topic', []),
      author: getInitialValue(artifactEditing, 'author', []),
      reviewer: getInitialValue(artifactEditing, 'reviewer', []),
      endorser: getInitialValue(artifactEditing, 'endorser', []),
      relatedArtifact: getInitialValue(artifactEditing, 'relatedArtifact', [])
    }),
    [artifactEditing]
  );

export default useInitialValues;
