import React from 'react';
import { IconButton, Paper } from '@mui/material';
import { Clear as ClearIcon, Edit as EditIcon } from '@mui/icons-material';
import { Tooltip } from 'components/elements';
import { useButtonStyles } from 'styles/hooks';
import useStyles from './styles';
import type { RecommendationAction as RecommendationActionType } from '../../../types/artifact';

interface RecommendationActionProps {
  action: RecommendationActionType;
  editAction: () => void;
  deleteAction: () => void;
}

const RecommendationAction: React.FC<RecommendationActionProps> = ({ action, editAction, deleteAction }) => {
  const buttonStyles = useButtonStyles();
  const styles = useStyles();
  return (
    <Paper className={styles.action} data-testid="action">
      <div>
        <div className={styles.actionTitle}>{(action.resource?.resourceType as string) || 'Unknown'} Create Action</div>
        <div>{action.description || ''}</div>
      </div>
      <div>
        <Tooltip title="Edit">
          <IconButton
            aria-label="edit action"
            className={buttonStyles.iconButton}
            onClick={editAction}
            color="primary"
            size="large"
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            aria-label="delete action"
            className={buttonStyles.iconButton}
            onClick={deleteAction}
            color="primary"
            size="large"
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </div>
    </Paper>
  );
};

export default RecommendationAction;
