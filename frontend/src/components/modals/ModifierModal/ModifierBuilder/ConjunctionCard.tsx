import React, { useCallback } from 'react';
import { produce } from 'immer';
import { Button, Card, IconButton } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';

import RuleCard from './RuleCard';
import { ToggleSwitch } from 'components/elements';
import ruleIsComplete from './utils/ruleIsComplete';
import type { Rule, ResourceOption } from '../types';
import useStyles from '../styles';

interface ConjunctionCardProps {
  depth: number;
  handleRemoveConjunction?: () => void;
  handleUpdateConjunction: (rule: Rule) => void;
  resourceOptions: ResourceOption[];
  rule: Rule;
}

const ConjunctionCard: React.FC<ConjunctionCardProps> = ({
  depth,
  handleRemoveConjunction,
  handleUpdateConjunction,
  resourceOptions,
  rule
}) => {
  const { conjunctionType, rules } = rule;
  const styles = useStyles();

  const handleToggleSwitch = (newConjunctionType: 'and' | 'or'): void => {
    if (newConjunctionType !== conjunctionType) {
      handleUpdateConjunction({ ...rule, conjunctionType: newConjunctionType });
    }
  };

  const addGroup = (): void => {
    handleUpdateConjunction({
      ...rule,
      rules: [...(rules ?? []), { id: uuidv4(), conjunctionType: conjunctionType === 'and' ? 'or' : 'and', rules: [] }]
    });
  };

  const addRule = (): void => {
    handleUpdateConjunction({ ...rule, rules: [...(rules ?? []), { id: uuidv4(), resourceProperty: '' }] });
  };

  const removeRule = useCallback(
    (ruleIndex: number): void =>
      handleUpdateConjunction(
        produce(rule, draftRule => {
          if (draftRule.rules) {
            draftRule.rules.splice(ruleIndex, 1);
          }
        })
      ),
    [handleUpdateConjunction, rule]
  );

  const updateRule = useCallback(
    (newState: Rule, ruleIndex: number): void =>
      handleUpdateConjunction(
        produce(rule, draftRule => {
          if (draftRule.rules) {
            draftRule.rules[ruleIndex] = newState;
          }
        })
      ),
    [handleUpdateConjunction, rule]
  );

  return (
    <div className={styles.rulesCardGroup}>
      {depth !== 0 && (
        <>
          <div className={clsx(styles.line, styles.lineHorizontal, styles.lineHorizontalCard)}></div>
          <div className={clsx(styles.line, styles.lineVertical)}></div>
        </>
      )}

      <Card
        className={clsx(
          styles.rulesCard,
          depth !== 0 && styles.indent,
          depth % 2 === 1 && styles.rulesCardOdd,
          !ruleIsComplete(rule) && styles.rulesCardGroupIncomplete
        )}
        data-testid="modifier-group"
      >
        <div className={styles.rulesCardGroup}>
          <div className={clsx(styles.line, styles.lineHorizontal, depth !== 0 && styles.lineHorizontalConnect)}></div>
          <div className={clsx(styles.line, styles.lineVertical, styles.lineVerticalTop)}></div>
          <ToggleSwitch className={styles.indent} onToggle={handleToggleSwitch} value={conjunctionType ?? 'and'} />
        </div>

        {handleRemoveConjunction && (
          <IconButton
            aria-label="remove group"
            className={styles.deleteButton}
            onClick={handleRemoveConjunction}
            size="large"
          >
            <ClearIcon />
          </IconButton>
        )}

        {(rules ?? []).map((nestedRule, index) =>
          nestedRule.conjunctionType ? (
            <ConjunctionCard
              key={nestedRule.id}
              rule={nestedRule}
              depth={depth + 1}
              handleRemoveConjunction={() => removeRule(index)}
              handleUpdateConjunction={newState => updateRule(newState, index)}
              resourceOptions={resourceOptions}
            />
          ) : (
            <RuleCard
              key={nestedRule.id}
              rule={nestedRule}
              handleRemoveRule={() => removeRule(index)}
              handleUpdateRule={newState => updateRule(newState, index)}
              resourceOptions={resourceOptions}
            />
          )
        )}

        <div className={clsx(styles.rulesCardGroup)}>
          <div className={clsx(styles.line, styles.lineHorizontal)}></div>
          <div className={clsx(styles.line, styles.lineVertical, styles.lineVerticalBottom)}></div>

          <div className={styles.indent}>
            <Button className={styles.textButton} onClick={addRule} color="primary" size="small">
              ADD RULE
            </Button>

            <Button className={styles.textButton} onClick={addGroup} color="primary" size="small">
              ADD GROUP
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConjunctionCard;
