import React from 'react';
import clsx from 'clsx';
import { Tooltip } from 'components/elements';

import useStyles from './styles';

interface ExpressionSentenceValue {
  modifierText?: string;
  leadingText?: string;
  type?: string;
  id?: string;
  label?: string;
  isTag?: boolean;
  isType?: boolean;
  isName?: boolean;
  tooltipText?: string;
  modifierExpression?: string;
}

interface ElementExpressionPhraseProps {
  closed?: boolean;
  expressions: ExpressionSentenceValue[];
  inModal?: boolean;
}

const ElementExpressionPhrase: React.FC<ElementExpressionPhraseProps> = ({ closed, expressions, inModal = false }) => {
  const styles = useStyles();

  return (
    <div
      className={clsx(
        styles.expressionPhrase,
        closed && styles.expressionPhraseClosed,
        !inModal && styles.expressionBorder
      )}
    >
      {expressions.map((expression, index) => (
        <Tooltip key={index} enabled={!!expression.tooltipText} title={expression.tooltipText || ''}>
          <span
            className={clsx(
              expression.isTag ? styles.expressionTag : styles.expressionText,
              expression.isType && styles.expressionType
            )}
          >
            {expression.label}
          </span>
        </Tooltip>
      ))}
    </div>
  );
};

export default ElementExpressionPhrase;
