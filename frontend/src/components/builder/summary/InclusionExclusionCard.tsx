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

export interface InclusionExclusionChild {
  childInstances?: InclusionExclusionChild[];
  elementType: string;
  elementId?: string;
  operand?: string;
  elementName?: string;
}

interface InclusionExclusionCardProps {
  children: InclusionExclusionChild[];
  depth: number;
  label: string;
  linkId?: string;
  operand?: string;
  parentOperand?: string;
  showOperand?: boolean;
  summaryType: 'expTreeInclude' | 'expTreeExclude' | 'recommendations';
  text: string;
}

const InclusionExclusionCard: React.FC<InclusionExclusionCardProps> = ({
  children,
  depth,
  label,
  linkId,
  operand,
  parentOperand,
  showOperand,
  summaryType,
  text
}) => {
  const tabIndex = getTabIndexFromName(summaryType);
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
    <>
      {showOperand && (
        <div className={styles.summaryCardOperand}>
          <div className={textStyles.bold}>{parentOperand}</div>
        </div>
      )}

      <Card className={clsx(depth % 2 === 1 && styles.summaryCardOdd)}>
        <CardContent className={styles.summaryCardContent}>
          <div className={styles.summaryCardContentGroup}>
            <div className={styles.summaryCardHeader}>
              <span className={textStyles.bold}>{label}</span>: {text}
            </div>

            {children.map((child, index) => (
              <InclusionExclusionCard
                key={index}
                children={child.childInstances}
                depth={depth + 1}
                label={child.elementType}
                linkId={child.elementId}
                operand={child.operand}
                parentOperand={operand}
                showOperand={index !== 0}
                summaryType={summaryType}
                text={child.elementName || ''}
              />
            ))}
          </div>

          {linkId && (
            <IconButton aria-label="link" color="primary" onClick={handleLinkToElement} size="large">
              <LinkIcon />
            </IconButton>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default InclusionExclusionCard;
