import React from 'react';
import clsx from 'clsx';

import InclusionExclusionCard, { type InclusionExclusionChild } from './InclusionExclusionCard';
import RecommendationCard from './RecommendationCard';
import { useSpacingStyles, useTextStyles } from 'styles/hooks';
import useStyles from './styles';
import type { Recommendation } from '../../../types/artifact';

interface RecommendationSummaryItem {
  recommendationId?: string;
  recommendationText?: string;
}

interface SummaryDetailsData {
  childInstances?: InclusionExclusionChild[];
  recommendations?: RecommendationSummaryItem[] | Recommendation[];
  operand?: string;
}

interface SummaryDetailsProps {
  summaryType: 'expTreeInclude' | 'expTreeExclude' | 'recommendations';
  summaryDetails: SummaryDetailsData;
}

const SummaryDetails: React.FC<SummaryDetailsProps> = ({ summaryType, summaryDetails }) => {
  const isInclusion = summaryType === 'expTreeInclude';
  const isRecommendation = summaryType === 'recommendations';
  const spacingStyles = useSpacingStyles();
  const textStyles = useTextStyles();
  const styles = useStyles();

  return (
    <div className={styles.summaryDetails}>
      <div className={styles.summaryDetailsHeader}>
        {isRecommendation ? (
          <>
            Perform the following <span className={textStyles.bold}>recommendations</span>:
          </>
        ) : (
          <>
            {isInclusion ? 'If' : 'And if'} the patient {isInclusion ? 'meets ' : "doesn't meet "}
            <span className={textStyles.bold}>{isInclusion ? 'inclusion' : 'exclusion'}</span> conditions:
          </>
        )}
      </div>

      {(summaryDetails.childInstances?.length === 0 || summaryDetails.recommendations?.length === 0) && (
        <div className={clsx(textStyles.subtext, textStyles.italic, spacingStyles.indent)}>
          No {isRecommendation ? summaryType : isInclusion ? 'inclusion conditions' : 'exclusion conditions'}
        </div>
      )}

      {isRecommendation
        ? summaryDetails.recommendations?.map((recommendation, index) => {
            if ('recommendationId' in recommendation) {
              const item = recommendation as RecommendationSummaryItem;
              return (
                <RecommendationCard
                  key={index}
                  depth={0}
                  label="Recommendation"
                  linkId={item.recommendationId}
                  recommendation={undefined}
                  text={item.recommendationText || ''}
                />
              );
            } else {
              const rec = recommendation as Recommendation;
              return (
                <RecommendationCard
                  key={index}
                  depth={0}
                  label="Recommendation"
                  linkId={rec.uid}
                  recommendation={rec}
                  text={rec.text || ''}
                />
              );
            }
          })
        : summaryDetails.childInstances?.map((child, index) => (
            <InclusionExclusionCard
              key={index}
              children={child.childInstances}
              depth={0}
              label={child.elementType}
              linkId={child.elementId}
              operand={child.operand}
              parentOperand={summaryDetails.operand}
              showOperand={index !== 0}
              summaryType={summaryType}
              text={child.elementName || ''}
            />
          ))}
    </div>
  );
};

export default SummaryDetails;
