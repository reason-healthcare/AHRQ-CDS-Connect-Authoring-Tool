import React, { useState } from 'react';
import { Card, CardContent, IconButton } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

import { useSpacingStyles } from 'styles/hooks';
import useStyles from './styles';
import { renderDate } from 'utils/dates';
import { ArtifactModal } from 'components/artifact';
import type { Artifact } from '../../../types/artifact';

interface SummaryHeaderProps {
  handleSaveArtifact: (artifact: Artifact | null, artifactProps: Record<string, unknown>) => void;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ handleSaveArtifact }) => {
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const spacingStyles = useSpacingStyles();
  const styles = useStyles();

  if (!artifact) return null;

  const artifactMetaData = [
    { label: 'Artifact', value: artifact.name },
    { label: 'Version', value: artifact.version },
    { label: 'Last Changed', value: renderDate(artifact.updatedAt) },
    { label: 'Date Created', value: renderDate(artifact.createdAt) }
  ];

  return (
    <Card className={spacingStyles.fullBleed}>
      <CardContent className={styles.summaryHeader}>
        <div className={styles.metaData}>
          {artifactMetaData.map((metaDataItem, index) => (
            <div key={index}>
              <span className={styles.metaDataLabel}>{metaDataItem.label}:</span>
              <span>{metaDataItem.value}</span>
            </div>
          ))}
        </div>

        <IconButton aria-label="edit" color="primary" onClick={() => setShowArtifactModal(true)} size="large">
          <EditIcon fontSize="small" />
        </IconButton>

        {showArtifactModal && (
          <ArtifactModal
            artifactEditing={artifact as never}
            handleCloseModal={() => setShowArtifactModal(false)}
            handleUpdateArtifact={handleSaveArtifact as never}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryHeader;
