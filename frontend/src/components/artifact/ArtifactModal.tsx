import React, { useState, useCallback, useRef } from 'react';
// eslint-disable-next-line import/named
import { Formik, type FormikProps } from 'formik';
import { formatISO } from 'date-fns';

import ArtifactModalForm from './ArtifactModalForm';
import { Modal } from 'components/elements';
import { useInitialValues } from './hooks';
import { stripContextFields, ContextField } from 'utils/fields';
import type { Artifact } from '../../types/artifact';
import { ArtifactFormValues } from './hooks/useInitialValues';

interface ArtifactSubmitValues {
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
  handleAddArtifact?: (values: ArtifactSubmitValues) => void;
  handleCloseModal: () => void;
  handleUpdateArtifact?: (artifact: Artifact, values: Partial<ArtifactSubmitValues>) => void;
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
        context: stripContextFields(values.context as ContextField[])
      };

      if (artifactEditing) {
        handleUpdateArtifact?.(artifactEditing, newValues);
      } else {
        handleAddArtifact?.(newValues);
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
