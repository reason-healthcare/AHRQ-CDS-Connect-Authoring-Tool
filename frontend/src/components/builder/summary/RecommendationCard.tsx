import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { useAppDispatch } from '../../../store/hooks';
import { Card, CardContent, IconButton } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import clsx from 'clsx';

import { setActiveTab, setScrollToId } from 'actions/navigation';
import { getTabIndexFromName } from 'components/builder/utils';
import { useTextStyles } from 'styles/hooks';
import useStyles from './styles';
import type { Recommendation } from '../../../types/artifact';

interface RecommendationCardProps {
  depth: number;
  label: string;
  linkId?: string;
  recommendation?: Recommendation;
  text: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ depth, label, linkId, recommendation, text }) => {
  const tabIndex = getTabIndexFromName('recommendations');
  const dispatch = useAppDispatch();
  const textStyles = useTextStyles();
  const styles = useStyles();

  const handleLinkToElement = () => {
    if (linkId) {
      dispatch(setScrollToId(linkId));
      dispatch(setActiveTab(tabIndex));
    }
  };

  return (
    <Card className={clsx(depth % 2 === 1 && styles.summaryCardOdd, depth === 0 && styles.summaryCardRoot)}>
      <CardContent className={styles.summaryCardContent}>
        <div className={styles.summaryCardContentGroup}>
          <div className={styles.summaryCardHeader}>
            <span className={textStyles.bold}>{label}</span>: {text}
          </div>

          {recommendation?.subpopulations?.map((subpopulation, index) => (
            <RecommendationCard
              key={index}
              depth={1}
              label="Subpopulation"
              text={subpopulation.subpopulationName || ''}
            />
          ))}

          {recommendation?.rationale && (
            <RecommendationCard depth={1} label="Rationale" text={recommendation.rationale} />
          )}

          {recommendation?.links?.map((link, index) => (
            <RecommendationCard
              key={index}
              depth={1}
              label="Link"
              text={"label: '" + link.label + "', url: '" + link.url + "'"}
            />
          ))}

          {recommendation?.suggestions?.map((suggestion, index) => (
            <RecommendationCard key={index} depth={1} label="Suggestion" text={suggestion.label || ''} />
          ))}
        </div>

        {recommendation && linkId && (
          <IconButton aria-label="link" color="primary" onClick={handleLinkToElement} size="large">
            <LinkIcon />
          </IconButton>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
