import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

import Recommendation from './Recommendation';
import type { Recommendation as RecommendationType } from '../../../types/artifact';

interface RecommendationsProps {
  handleUpdateRecommendations: (recommendations: RecommendationType[]) => void;
}

const deleteRecommendations = produce((recommendations: RecommendationType[], index: number) => {
  recommendations.splice(index, 1);
});

const moveRecommendation = produce((recommendations: RecommendationType[], fromIndex: number, toIndex: number) => {
  const recommendation = recommendations[fromIndex];
  recommendations.splice(fromIndex, 1);
  recommendations.splice(toIndex, 0, recommendation);
});

const updateRecommendation = produce(
  (recommendations: RecommendationType[], index: number, recommendation: RecommendationType) => {
    recommendations[index] = recommendation;
  }
);

const Recommendations: React.FC<RecommendationsProps> = ({ handleUpdateRecommendations }) => {
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { recommendations, subpopulations } = artifact || { recommendations: undefined, subpopulations: undefined };

  useEffect(() => {
    if (scrollTo) {
      const element = document.getElementById(scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setScrollTo(null);
      }
    }
  }, [scrollTo]);

  if (!artifact) return null;

  const addRecommendation = (): void => {
    const newRecommendation: RecommendationType = {
      grade: 'A',
      text: '',
      rationale: '',
      comment: '',
      uid: uuidv4(),
      subpopulations: [],
      links: [],
      suggestions: []
    };
    const newRecommendations = (recommendations || []).concat([newRecommendation]);
    handleUpdateRecommendations(newRecommendations);
    setScrollTo(newRecommendation.uid || null);
  };

  const deleteRecommendation = (index: number): void => {
    const newRecommendations = produce(recommendations || [], draft => {
      deleteRecommendations(draft, index);
    });
    handleUpdateRecommendations(newRecommendations);
  };

  const moveRecommendationUp = (index: number): void => {
    if (index === 0) return;
    const newRecommendations = produce(recommendations || [], draft => {
      moveRecommendation(draft, index, index - 1);
    });
    handleUpdateRecommendations(newRecommendations);
  };

  const moveRecommendationDown = (index: number): void => {
    if (index === (recommendations?.length || 0) - 1) return;
    const newRecommendations = produce(recommendations || [], draft => {
      moveRecommendation(draft, index, index + 1);
    });
    handleUpdateRecommendations(newRecommendations);
  };

  const updateRecommendationAtIndex = (index: number, recommendation: RecommendationType): void => {
    const newRecommendations = produce(recommendations || [], draft => {
      updateRecommendation(draft, index, recommendation);
    });
    handleUpdateRecommendations(newRecommendations);
  };

  return (
    <div>
      <div>
        <Button color="primary" onClick={addRecommendation} variant="contained">
          Add Recommendation
        </Button>
      </div>

      {recommendations && recommendations.length > 0 ? (
        recommendations.map((recommendation, index) => (
          <Recommendation
            key={recommendation.uid || index}
            handleDeleteRecommendation={() => deleteRecommendation(index)}
            handleMoveRecommendation={(direction: 'up' | 'down') => {
              if (direction === 'up') moveRecommendationUp(index);
              else moveRecommendationDown(index);
            }}
            handleUpdateRecommendation={updatedRecommendation =>
              updateRecommendationAtIndex(index, updatedRecommendation)
            }
            recommendation={recommendation}
            canMoveUp={index > 0}
            canMoveDown={index < (recommendations.length || 0) - 1}
            artifactSubpopulations={subpopulations || []}
            setScrollTo={setScrollTo}
          />
        ))
      ) : (
        <div>No recommendations defined.</div>
      )}
    </div>
  );
};

export default Recommendations;
