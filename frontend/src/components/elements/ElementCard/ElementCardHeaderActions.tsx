import React, { useState } from 'react';
import { IconButton } from '@mui/material';
import {
  ChatBubble as ChatBubbleIcon,
  Clear as ClearIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FormatIndentDecrease as FormatIndentDecreaseIcon,
  FormatIndentIncrease as FormatIndentIncreaseIcon,
  Sms as SmsIcon
} from '@mui/icons-material';

import { DeleteConfirmationModal } from 'components/modals';
import { Tooltip } from 'components/elements';
import { changeToCase } from 'utils/strings';

interface ElementCardHeaderActionsProps {
  allowComment?: boolean;
  allowIndent?: boolean;
  allowOutdent?: boolean;
  disableDeleteMessage: string | boolean;
  disableIndentMessage?: string | boolean;
  handleDelete: () => void;
  handleIndent?: () => void;
  handleOutdent?: () => void;
  handleToggleContent: () => void;
  handleToggleComment: () => void;
  hasComment: boolean;
  label: string;
  showContent: boolean;
  showComment: boolean;
  titleValue?: string;
}

const ElementCardHeaderActions: React.FC<ElementCardHeaderActionsProps> = ({
  allowComment = true,
  allowIndent = false,
  allowOutdent = false,
  disableDeleteMessage,
  disableIndentMessage,
  handleDelete,
  handleIndent,
  handleOutdent,
  handleToggleContent,
  handleToggleComment,
  hasComment,
  label,
  showContent,
  showComment,
  titleValue
}) => {
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

  const handleDeleteElement = (): void => {
    handleDelete();
    setShowConfirmDeleteModal(false);
  };

  return (
    <>
      {showContent && allowOutdent && (
        <Tooltip title={(disableIndentMessage as string) || 'Outdent'}>
          <IconButton
            aria-label="outdent"
            color="primary"
            disabled={Boolean(disableIndentMessage)}
            onClick={handleOutdent}
          >
            <FormatIndentDecreaseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {showContent && allowIndent && (
        <Tooltip title={(disableIndentMessage as string) || 'Indent'}>
          <IconButton
            aria-label="indent"
            color="primary"
            disabled={Boolean(disableIndentMessage)}
            onClick={handleIndent}
          >
            <FormatIndentIncreaseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {showContent && allowComment && (
        <Tooltip title={showComment ? 'Hide Comment' : 'Show Comment'}>
          <IconButton
            aria-label={showComment ? 'hide comment' : 'show comment'}
            color="primary"
            onClick={handleToggleComment}
            sx={{ color: hasComment && 'common.blueHighlight' }}
          >
            {hasComment ? <SmsIcon fontSize="small" /> : <ChatBubbleIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={showContent ? 'Collapse' : 'Expand'}>
        <IconButton aria-label={showContent ? 'collapse' : 'expand'} color="primary" onClick={handleToggleContent}>
          {showContent ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Tooltip title={(disableDeleteMessage as string) || 'Delete'}>
        <IconButton
          aria-label={`delete ${label}`}
          color="primary"
          disabled={Boolean(disableDeleteMessage)}
          onClick={() => setShowConfirmDeleteModal(true)}
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {showConfirmDeleteModal && (
        <DeleteConfirmationModal
          deleteType={label}
          handleCloseModal={() => setShowConfirmDeleteModal(false)}
          handleDelete={handleDeleteElement}
        >
          <>
            {changeToCase(label, 'capitalCase')}: {titleValue || 'unnamed'}
          </>
        </DeleteConfirmationModal>
      )}
    </>
  );
};

export default ElementCardHeaderActions;
