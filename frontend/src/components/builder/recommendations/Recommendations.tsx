import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@mui/material';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

import Recommendation from './Recommendation';
import type { Recommendation as RecommendationType } from '../../../types/artifact';
import type { RootState } from '../../../reducers';

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
  const artifact = useSelector((state: RootState) => state.artifacts.artifact);
  const { recommendations, subpopulations } = artifact;

  useEffect(() => {
    if (scrollTo) {
      document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
      setScrollTo(null);
    }
  }, [scrollTo]);

  const addRecommendation = (): void => {
    handleUpdateRecommendations(
      recommendations.concat([
        {
          uid: uuidv4(),
          grade: 'A',
          subpopulations: [],
          text: '',
          rationale: '',
          comment: '',
          links: [],
          suggestions: []
        }
      ])
    );
  };

  return (
    <>
      {recommendations.map((recommendation, index) => (
        <div key={recommendation.uid} id={recommendation.uid}>
          <Recommendation
            artifactSubpopulations={subpopulations}
            canMoveDown={index !== recommendations.length - 1}
            canMoveUp={index > 0}
            handleDeleteRecommendation={() =>
              handleUpdateRecommendations(deleteRecommendations(recommendations, index))
            }
            handleMoveRecommendation={(direction: 'up' | 'down') => {
              handleUpdateRecommendations(
                moveRecommendation(recommendations, index, direction === 'up' ? index - 1 : index + 1)
              );
              setScrollTo(recommendation.uid || null);
            }}
            handleUpdateRecommendation={(updatedRecommendation: RecommendationType) => {
              handleUpdateRecommendations(updateRecommendation(recommendations, index, updatedRecommendation));
            }}
            recommendation={recommendation}
            setScrollTo={setScrollTo}
          />
        </div>
      ))}

      <Button color="primary" onClick={addRecommendation} variant="contained">
        New recommendation
      </Button>
    </>
  );
};

export default Recommendations;
