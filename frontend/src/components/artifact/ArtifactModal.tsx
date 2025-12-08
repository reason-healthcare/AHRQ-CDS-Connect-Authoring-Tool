import React, { useState, useCallback, useRef } from 'react';
import { Formik, FormikProps } from 'formik';
import { formatISO } from 'date-fns';

import ArtifactModalForm from './ArtifactModalForm';
import { Modal } from 'components/elements';
import { useInitialValues } from './hooks';
import { stripContextFields } from 'utils/fields';
import type { Artifact } from '../../types/artifact';

// ContextField type from utils/fields.ts
interface ContextField {
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

interface ArtifactFormValues {
  name: string;
  version: string;
  description: string;
  url: string;
  status: string | null;
  experimental: string | null;
  publisher: string;
  context: Array<Record<string, unknown>>;
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

interface ArtifactSubmitValues {
  name: string;
  version: string;
  description: string;
  url: string;
  status: string | null;
  experimental: string | null;
  publisher: string;
  context: Array<Record<string, unknown>>;
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
  approvalDate: string | null;
  lastReviewDate: string | null;
  effectivePeriod: {
    start: string | null;
    end: string | null;
  };
  topic: Array<Record<string, unknown>>;
  author: Array<Record<string, unknown>>;
  reviewer: Array<Record<string, unknown>>;
  endorser: Array<Record<string, unknown>>;
  relatedArtifact: Array<Record<string, unknown>>;
}

interface ArtifactModalProps {
  artifactEditing?: Artifact | null;
  handleAddArtifact?: (values: Record<string, unknown>) => void;
  handleCloseModal: () => void;
  handleUpdateArtifact?: (artifact: Artifact, values: Record<string, unknown>) => void;
}

function dateToStringTransform(value: Date | null): string | null {
  if (value == null) return null;
  return formatISO(value);
}

const ArtifactModal: React.FC<ArtifactModalProps> = ({
  artifactEditing,
  handleAddArtifact,
  handleCloseModal,
  handleUpdateArtifact
}) => {
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(true);
  const initialValues = useInitialValues(artifactEditing);
  const formRef = useRef<FormikProps<ArtifactFormValues>>(null);

  const handleSaveModal = useCallback(() => {
    formRef.current?.submitForm();
  }, []);

  const validate = useCallback((values: ArtifactFormValues): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (values.name === '') errors.name = 'Required';
    return errors;
  }, []);

  const handleSubmit = useCallback(
    (values: ArtifactFormValues) => {
      const newValues: ArtifactSubmitValues = {
        ...values,
        approvalDate: dateToStringTransform(values.approvalDate),
        lastReviewDate: dateToStringTransform(values.lastReviewDate),
        effectivePeriod: {
          start: dateToStringTransform(values.effectivePeriod.start),
          end: dateToStringTransform(values.effectivePeriod.end)
        },
        context: stripContextFields(values.context as unknown as ContextField[]) as unknown as Array<
          Record<string, unknown>
        >
      };

      if (artifactEditing) {
        handleUpdateArtifact?.(artifactEditing, newValues as unknown as Record<string, unknown>);
      } else {
        handleAddArtifact?.(newValues as unknown as Record<string, unknown>);
      }

      handleCloseModal();
    },
    [artifactEditing, handleAddArtifact, handleCloseModal, handleUpdateArtifact]
  );

  return (
    <Modal
      handleCloseModal={handleCloseModal}
      handleSaveModal={handleSaveModal}
      isOpen
      maxWidth="xl"
      submitButtonText={artifactEditing ? 'Save' : 'Create'}
      submitDisabled={submitDisabled}
      title={artifactEditing ? 'Edit Library Details' : 'Create New Library'}
    >
      <Formik
        innerRef={formRef}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validate={validate}
        validateOnMount
      >
        <ArtifactModalForm setSubmitDisabled={setSubmitDisabled} />
      </Formik>
    </Modal>
  );
};

export default ArtifactModal;
