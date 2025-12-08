import React, { useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Stack, TextField } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';

import RecommendationAction from './RecommendationAction';
import RecommendationActionModal from './RecommendationActionModal';
import type {
  RecommendationSuggestion as RecommendationSuggestionType,
  RecommendationAction as RecommendationActionType
} from '../../../types/artifact';

interface RecommendationSuggestionProps {
  addAction: (action: RecommendationActionType) => void;
  updateAction: (action: RecommendationActionType, actionIndex: number) => void;
  updateSuggestion: (label: string) => void;
  deleteAction: (actionIndex: number) => void;
  deleteSuggestion: () => void;
  index: number;
  suggestion: RecommendationSuggestionType;
}

const RecommendationSuggestion: React.FC<RecommendationSuggestionProps> = ({
  addAction,
  updateAction,
  updateSuggestion,
  deleteAction,
  deleteSuggestion,
  index,
  suggestion
}) => {
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentActionResourceType, setCurrentActionResourceType] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const newAction = (type: string) => {
    setMenuAnchorEl(null);
    setShowModal(true);
    setCurrentIndex(-1);
    setCurrentActionResourceType(type);
  };

  const editAction = (actionIndex: number) => {
    setShowModal(true);
    setCurrentIndex(actionIndex);
    const action = suggestion.actions?.[actionIndex];
    if (action?.resource) {
      setCurrentActionResourceType((action.resource.resourceType as string) || null);
    }
  };

  return (
    <Stack my={2}>
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        Suggestion {index + 1}
        <IconButton aria-label="remove suggestion" color="primary" onClick={deleteSuggestion}>
          <ClearIcon fontSize="small" />
        </IconButton>
      </Stack>
      <TextField
        fullWidth
        hiddenLabel
        multiline
        onChange={event => updateSuggestion(event.target.value)}
        placeholder="Label for your suggestion"
        value={suggestion.label || ''}
      />
      <Box sx={{ borderLeft: '3px solid darkgrey', paddingLeft: '20px' }} m={2}>
        {suggestion.actions?.map((action, actionIndex) => (
          <RecommendationAction
            key={(action as { uid?: string })?.uid || actionIndex}
            action={action}
            editAction={() => editAction(actionIndex)}
            deleteAction={() => deleteAction(actionIndex)}
          />
        ))}
        <Stack direction="row">
          <Button color="primary" onClick={handleMenuClick} variant="contained">
            Add action
          </Button>
        </Stack>
      </Box>
      <Menu
        anchorEl={menuAnchorEl}
        id="download-menu"
        keepMounted
        onClose={handleMenuClose}
        open={Boolean(menuAnchorEl)}
      >
        <MenuItem onClick={() => newAction('MedicationRequest')}>Medication Request</MenuItem>
        <MenuItem onClick={() => newAction('ServiceRequest')}>Service Request</MenuItem>
      </Menu>
      {showModal && currentActionResourceType && (
        <RecommendationActionModal
          closeModal={() => setShowModal(false)}
          type={currentActionResourceType}
          action={(suggestion.actions?.[currentIndex] as RecommendationActionType) ?? {}}
          saveAction={(action: RecommendationActionType) => {
            setShowModal(false);
            currentIndex === -1 ? addAction(action) : updateAction(action, currentIndex);
          }}
        />
      )}
    </Stack>
  );
};

export default RecommendationSuggestion;
