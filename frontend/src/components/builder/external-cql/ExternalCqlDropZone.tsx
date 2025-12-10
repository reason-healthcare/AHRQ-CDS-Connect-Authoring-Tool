import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
// eslint-disable-next-line import/no-unresolved
import { useAppDispatch } from '../../../store/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Alert, CircularProgress } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import clsx from 'clsx';

import { Modal } from 'components/elements';
import { loadArtifact } from 'actions/artifacts';
import { fetchArtifact, saveArtifact } from 'queries/artifacts';
import { addExternalCql } from 'queries/external-cql';
import { useDropZoneStyles, useSpacingStyles } from 'styles/hooks';
import type { Artifact } from 'types/artifact';
import type { ExternalCqlLibrary } from 'types/query';

interface AddExternalCqlError {
  statusText?: string;
  cqlErrors?: Array<{ message?: string; [key: string]: string | number | boolean | undefined }>;
}

const ExternalCqlDropZone: React.FC = () => {
  const artifact = useSelector((state: { artifacts: { artifact: Artifact } }) => state.artifacts.artifact) as Artifact;
  const [message, setMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [uploadCqlErrors, setUploadCqlErrors] = useState<string[] | null>(null);
  const dispatch = useAppDispatch();
  const dropZoneStyles = useDropZoneStyles();
  const spacingStyles = useSpacingStyles();
  const queryClient = useQueryClient();
  const { mutate: invokeFetchArtifact } = useMutation({
    mutationFn: fetchArtifact
  });
  const handleLoadArtifact = useCallback(
    (id: string) => {
      invokeFetchArtifact(
        { artifactId: id },
        {
          onSuccess: data => {
            dispatch(loadArtifact(data));
          }
        }
      );
    },
    [invokeFetchArtifact, dispatch]
  );
  const { mutateAsync: invokeSaveArtifact } = useMutation({
    mutationFn: saveArtifact
  });
  const handleSaveArtifact = useCallback(async () => {
    try {
      await invokeSaveArtifact(
        { artifact },
        {
          onSuccess: data => {
            dispatch(loadArtifact(data));
          }
        }
      );
    } catch (error) {
      console.error('Save artifact failed:', error);
    }
  }, [invokeSaveArtifact, artifact, dispatch]);
  const addMutation = useMutation<
    ExternalCqlLibrary,
    AddExternalCqlError,
    { library: Record<string, string | number | boolean | undefined> }
  >({
    mutationFn: async ({ library }) => addExternalCql(library),
    onSuccess: (library: ExternalCqlLibrary) => {
      setMessage('Library successfully added');
      if (artifact._id) {
        queryClient.refetchQueries({ queryKey: ['externalCql', { artifactId: artifact._id }] }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['modifiers'] });
          handleLoadArtifact(artifact._id);
        });
      }
    },
    onError: (error: AddExternalCqlError) => {
      setUploadErrorMessage(null); // Clear error message if any
      const errorText = error.statusText || 'An error occurred.';
      // Display "already includes" messages as info instead of error
      if (/already includes/i.test(errorText)) {
        setMessage(errorText);
      } else {
        setMessage(null);
        setUploadErrorMessage(errorText);
      }
      setUploadCqlErrors(
        error.cqlErrors ? [...new Set(error.cqlErrors.map(err => err.message || '').filter(Boolean))] : null
      );
    }
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/zip': ['.zip'],
      'text/plain': ['.cql']
    },
    disabled: artifact._id == null,
    maxFiles: 1,
    onDrop: (files: File[]) => {
      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const cqlFileName = files[0].name;
        const cqlFileType = files[0].type;
        const fileContentToSend =
          typeof event.target?.result === 'string'
            ? event.target.result.slice(event.target.result.indexOf(',') + 1)
            : '';

        if (cqlFileType !== 'application/zip' || (cqlFileType === 'application/zip' && cqlFileName.endsWith('.zip'))) {
          const library = {
            cqlFileName,
            cqlFileContent: fileContentToSend,
            fileType: cqlFileType,
            artifact
          } as unknown as Record<string, string | number | boolean | undefined>;
          setUploadErrorMessage(null);
          handleSaveArtifact();
          addMutation.mutate({ library });
        } else {
          setUploadErrorMessage('Invalid file type. Only .cql and .zip files can be uploaded.');
        }
      };

      try {
        reader.readAsDataURL(files[0]);
      } catch (error) {
        setUploadErrorMessage('Invalid file type. Only .cql and .zip files can be uploaded.');
      }
    }
  });

  return (
    <div id="external-cql-drop-zone">
      <section className={clsx(dropZoneStyles.dropZoneSection, spacingStyles.verticalPadding)}>
        <div
          data-testid="external-cql-dropzone"
          {...getRootProps({ className: clsx('dropzone', artifact._id == null && 'disabled') })}
        >
          <input {...getInputProps()} />
          {addMutation.isPending ? <CircularProgress /> : <CloudUploadIcon className={dropZoneStyles.dropZoneIcon} />}
          <div>Drop a valid external CQL library or zip file here, or click to browse.</div>
        </div>

        {message && (
          <Alert
            className={spacingStyles.verticalPadding}
            onClose={() => {
              setMessage(null);
              addMutation.reset();
            }}
            severity="info"
          >
            {message}
          </Alert>
        )}

        {uploadErrorMessage && (
          <Alert className={spacingStyles.verticalPadding} onClose={() => setUploadErrorMessage(null)} severity="error">
            {uploadErrorMessage}
          </Alert>
        )}

        {artifact._id == null && (
          <Alert className={spacingStyles.verticalPadding} severity="error">
            Artifact must be saved before uploading libraries.
          </Alert>
        )}

        {addMutation.isSuccess && !message && (
          <Alert className={spacingStyles.verticalPadding} onClose={() => addMutation.reset()} severity="success">
            Library successfully added.
          </Alert>
        )}

        {uploadCqlErrors && uploadCqlErrors.length > 0 && (
          <Modal
            title="About your CQL..."
            submitButtonText="Close"
            isOpen
            handleCloseModal={() => setUploadCqlErrors(null)}
            handleSaveModal={() => setUploadCqlErrors(null)}
          >
            <div>
              We've detected some errors in the CQL file you attempted to upload:
              <ul>
                {uploadCqlErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </Modal>
        )}
      </section>
    </div>
  );
};

export default ExternalCqlDropZone;
