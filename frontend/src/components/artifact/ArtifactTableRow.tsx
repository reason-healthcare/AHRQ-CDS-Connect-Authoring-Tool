import React, { useCallback, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { IconButton, Link, TableCell } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, FileCopy as CopyIcon } from '@mui/icons-material';

import ArtifactModal from './ArtifactModal';
import { DeleteConfirmationModal } from 'components/modals';
import { Tooltip } from 'components/elements';
import { renderDate } from 'utils/dates';
import fhirVersionMap from 'data/fhirVersionMap';
import type { Artifact } from '../../types/artifact';
import { useButtonStyles, useTextStyles } from 'styles/hooks';

interface ArtifactTableRowProps {
  artifact: Artifact;
  handleDeleteArtifact: (artifact: Artifact) => Promise<void>;
  handleDuplicateArtifact: (artifactProps: { _id: string }) => Promise<void>;
  handleUpdateArtifact: (artifact: Artifact, artifactProps: Partial<Artifact>) => Promise<void>;
}

const ArtifactTableRow: React.FC<ArtifactTableRowProps> = ({
  artifact,
  handleDeleteArtifact,
  handleDuplicateArtifact,
  handleUpdateArtifact
}) => {
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const buttonStyles = useButtonStyles();
  const textStyles = useTextStyles();

  const deleteArtifact = useCallback(
    (artifactToDelete: Artifact) => {
      handleDeleteArtifact(artifactToDelete);
      setShowDeleteConfirmationModal(false);
    },
    [handleDeleteArtifact]
  );

  return (
    <>
      <TableCell className={textStyles.bold}>
        <Link component={RouterLink} to={`/build/${artifact._id}`}>
          {artifact.name}
        </Link>
      </TableCell>

      <TableCell>{artifact.version}</TableCell>
      <TableCell>{artifact.fhirVersion ? fhirVersionMap[artifact.fhirVersion] || artifact.fhirVersion : ''}</TableCell>
      <TableCell>{renderDate(artifact.updatedAt)}</TableCell>
      <TableCell>{renderDate(artifact.createdAt)}</TableCell>

      <TableCell align="right">
        <Tooltip title="Edit Info">
          <IconButton
            aria-label="edit info"
            className={buttonStyles.iconButton}
            color="primary"
            onClick={() => setShowArtifactModal(true)}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Duplicate">
          <IconButton
            aria-label="duplicate"
            className={buttonStyles.iconButton}
            color="primary"
            onClick={() => {
              if (artifact._id) {
                handleDuplicateArtifact({ _id: artifact._id });
              }
            }}
          >
            <CopyIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete">
          <IconButton
            aria-label="delete"
            className={buttonStyles.iconButton}
            color="secondary"
            onClick={() => setShowDeleteConfirmationModal(true)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </TableCell>

      {showArtifactModal && (
        <ArtifactModal
          artifactEditing={artifact as never}
          handleCloseModal={() => setShowArtifactModal(false)}
          handleUpdateArtifact={handleUpdateArtifact as never}
        />
      )}

      {showDeleteConfirmationModal && (
        <DeleteConfirmationModal
          deleteType="CDS Artifact"
          handleCloseModal={() => setShowDeleteConfirmationModal(false)}
          handleDelete={() => deleteArtifact(artifact)}
        >
          <>
            <div>Name: {artifact.name}</div>
            <div>Version: {artifact.version}</div>
            <div>FHIR Version: {artifact.fhirVersion}</div>
          </>
        </DeleteConfirmationModal>
      )}
    </>
  );
};

export default ArtifactTableRow;
