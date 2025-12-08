import React, { useMemo, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, CardActions, CardContent, CardHeader, TextField } from '@mui/material';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from 'react-redux';

import { Tooltip } from 'components/elements';
import RecommendationControls from './RecommendationControls';
import RecommendationField from './RecommendationField';
import RecommendationLink from './RecommendationLink';
import RecommendationSubpopulations from './RecommendationSubpopulations';
import RecommendationSuggestion from './RecommendationSuggestion';

const updateRecommendation = (recommendation, field, value) => {
  return produce(recommendation, draft => {
    draft[field] = value;
  });
};

const deleteLink = produce((recommendation, index) => {
  recommendation.links.splice(index, 1);
});

const updateLink = produce((recommendation, index, field, value) => {
  recommendation.links[index][field] = value;
});

const addAction = produce((recommendation, index, action) => {
  recommendation.suggestions[index].actions.push({
    type: 'create',
    description: action.description,
    resource: { ...action.resource }
  });
});

const updateAction = produce((recommendation, index, action, actionIndex) => {
  recommendation.suggestions[index].actions[actionIndex] = {
    type: 'create',
    description: action.description,
    resource: { ...action.resource }
  };
});

// since actions are handled separately and uid doesn't change, this only updates the label
const updateSuggestion = produce((recommendation, index, label) => {
  recommendation.suggestions[index].label = label;
});

const deleteAction = produce((recommendation, index, actionIndex) => {
  recommendation.suggestions[index].actions.splice(actionIndex, 1);
});

const deleteSuggestion = produce((recommendation, index) => {
  recommendation.suggestions.splice(index, 1);
});

const Recommendation = ({
  artifactSubpopulations,
  canMoveUp,
  canMoveDown,
  handleDeleteRecommendation,
  handleMoveRecommendation,
  handleUpdateRecommendation,
  recommendation,
  setScrollTo
}) => {
  const artifact = useSelector(state => state.artifacts.artifact);
  // Use ref to store current recommendation for use in event handlers to avoid stale closures
  const recommendationRef = useRef(recommendation);
  useEffect(() => {
    recommendationRef.current = recommendation;
  }, [recommendation]);
  const { comment, links, rationale, subpopulations, suggestions = [], text } = recommendation;
  const [showRationale, setShowRationale] = useState(rationale !== '');
  const [showComment, setShowComment] = useState(false);
  const [showAddSubpopulation, setShowAddSubpopulation] = useState(false);

  const subpopulationOptions = useMemo(
    () =>
      artifactSubpopulations.filter(
        artifactSubpopulation =>
          !subpopulations.some(subpopulation => artifactSubpopulation.uniqueId === subpopulation.uniqueId)
      ),
    [artifactSubpopulations, subpopulations]
  );

  const deleteRationale = () => {
    handleUpdateRecommendation(updateRecommendation(recommendationRef.current, 'rationale', ''));
    setShowRationale(false);
  };

  const addSubpopulation = () => {
    setShowAddSubpopulation(true);
    setScrollTo(recommendation.uid);
  };

  const addLink = () => {
    handleUpdateRecommendation(
      produce(recommendationRef.current, draftRecommendation => {
        draftRecommendation.links.push({ uid: uuidv4(), type: '', label: '', url: '' });
      })
    );
  };

  const addSuggestion = () => {
    handleUpdateRecommendation(
      produce(recommendationRef.current, draftRecommendation => {
        draftRecommendation.suggestions.push({ uid: uuidv4(), label: '', actions: [] });
      })
    );
  };

  return (
    <Card>
      <CardHeader
        action={
          <RecommendationControls
            canMoveDown={canMoveDown}
            canMoveUp={canMoveUp}
            comment={comment}
            handleDeleteRecommendation={handleDeleteRecommendation}
            handleMoveRecommendation={handleMoveRecommendation}
            setShowComment={setShowComment}
            showComment={showComment}
            text={text}
          />
        }
        subheader={
          <Box my={2}>
            {(subpopulations.length > 0 || showAddSubpopulation) && (
              <RecommendationSubpopulations
                artifactSubpopulations={artifactSubpopulations}
                recommendationSubpopulations={subpopulations}
                showAddSubpopulation={showAddSubpopulation}
                setShowAddSubpopulation={setShowAddSubpopulation}
                subpopulationOptions={subpopulationOptions}
                handleUpdateSubpopulations={subpopulations =>
                  handleUpdateRecommendation(
                    updateRecommendation(recommendationRef.current, 'subpopulations', subpopulations)
                  )
                }
              />
            )}
            Recommend...
            <Box my={1}>
              <TextField
                fullWidth
                hiddenLabel
                multiline
                onChange={event => {
                  // Use the recommendation prop structure but with the new text value from the event
                  const updatedRecommendation = { ...recommendationRef.current, text: event.target.value };
                  handleUpdateRecommendation(updatedRecommendation);
                }}
                placeholder="Describe your recommendation"
                value={text}
              />
            </Box>
            {showComment && (
              <Box my={2}>
                Comment...
                <TextField
                  fullWidth
                  hiddenLabel
                  multiline
                  onChange={event =>
                    handleUpdateRecommendation(
                      updateRecommendation(recommendationRef.current, 'comment', event.target.value)
                    )
                  }
                  placeholder="Add an optional comment"
                  value={comment}
                />
              </Box>
            )}
          </Box>
        }
        sx={{ padding: '20px 40px', position: 'relative' }}
      />

      <CardContent sx={{ padding: '0 40px' }}>
        {showRationale && (
          <Box my={1}>
            <RecommendationField
              handleChangeField={event =>
                handleUpdateRecommendation(
                  updateRecommendation(recommendationRef.current, 'rationale', event.target.value)
                )
              }
              handleDeleteField={deleteRationale}
              label="Rationale..."
              placeholder="Describe the rationale for your recommendation"
              value={rationale}
            />
          </Box>
        )}

        {links.map((link, index) => (
          <RecommendationLink
            key={link.uid || index}
            handleChangeLink={(field, value) =>
              handleUpdateRecommendation(updateLink(recommendationRef.current, index, field, value))
            }
            handleDeleteLink={() => handleUpdateRecommendation(deleteLink(recommendationRef.current, index))}
            label={`Link${links.length > 1 ? ` ${index + 1}` : ''}...`}
            link={link}
          />
        ))}

        {suggestions.map((suggestion, index) => (
          <RecommendationSuggestion
            key={suggestion.uid || index}
            addAction={action => handleUpdateRecommendation(addAction(recommendationRef.current, index, action))}
            updateAction={(action, actionIndex) =>
              handleUpdateRecommendation(updateAction(recommendationRef.current, index, action, actionIndex))
            }
            updateSuggestion={label =>
              handleUpdateRecommendation(updateSuggestion(recommendationRef.current, index, label))
            }
            deleteAction={actionIndex =>
              handleUpdateRecommendation(deleteAction(recommendationRef.current, index, actionIndex))
            }
            deleteSuggestion={() => handleUpdateRecommendation(deleteSuggestion(recommendationRef.current, index))}
            index={index}
            suggestion={suggestion}
          />
        ))}
      </CardContent>

      <CardActions>
        {!showRationale && (
          <Button color="primary" onClick={() => setShowRationale(true)} variant="contained">
            Add rationale
          </Button>
        )}

        <Button color="primary" onClick={addLink} variant="contained">
          Add link
        </Button>

        <Tooltip
          enabled={!(artifact.fhirVersion === '' || artifact.fhirVersion.startsWith('4.0.'))}
          title={'Suggestions are only supported for FHIR R4 artifacts'}
        >
          <Button
            color="primary"
            onClick={addSuggestion}
            variant="contained"
            disabled={!(artifact.fhirVersion === '' || artifact.fhirVersion.startsWith('4.0.'))}
          >
            Add suggestion
          </Button>
        </Tooltip>

        {subpopulationOptions.length > 0 && subpopulations.length === 0 && !showAddSubpopulation && (
          <Button color="primary" onClick={addSubpopulation} variant="contained">
            Add subpopulation
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

Recommendation.propTypes = {
  artifactSubpopulations: PropTypes.array.isRequired,
  canMoveUp: PropTypes.bool.isRequired,
  canMoveDown: PropTypes.bool.isRequired,
  handleDeleteRecommendation: PropTypes.func.isRequired,
  handleMoveRecommendation: PropTypes.func.isRequired,
  handleUpdateRecommendation: PropTypes.func.isRequired,
  recommendation: PropTypes.object.isRequired,
  setScrollTo: PropTypes.func.isRequired
};

export default Recommendation;
