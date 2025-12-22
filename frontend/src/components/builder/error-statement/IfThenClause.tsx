import React from 'react';
import { useSelector } from 'react-redux';
import { Alert, Button } from '@mui/material';
import clsx from 'clsx';
import _ from 'lodash';

import ErrorStatementLabel from './ErrorStatementLabel';
import IfConditionSelect from './IfConditionSelect';
import NestedErrorStatement from './NestedErrorStatement';
import ThenClause from './ThenClause';
import {
  generateErrorStatement,
  getStatementById,
  ifThenClauseMissingStatementWarning,
  ifThenClauseDisabledIfConditionWarning
} from './utils';
import useStyles from './styles';
import type { ErrorStatement, ErrorStatementIfThenClause, ExpressionTree } from 'types/artifact';

interface IfThenClauseProps {
  handleDeleteIfThenClause: () => void;
  handleUpdateErrorStatement: (errorStatement: ErrorStatement) => void;
  ifThenClause: ErrorStatementIfThenClause;
  index: number;
  statement: ErrorStatement;
}

const IfThenClause: React.FC<IfThenClauseProps> = ({
  handleDeleteIfThenClause,
  handleUpdateErrorStatement,
  ifThenClause,
  index,
  statement
}) => {
  const artifact = useSelector(
    (state: {
      artifacts: {
        artifact: {
          errorStatement: ErrorStatement;
          expTreeExclude: ExpressionTree;
          expTreeInclude: ExpressionTree;
        };
      };
    }) => state.artifacts.artifact
  );
  const { errorStatement, expTreeExclude, expTreeInclude } = artifact;
  const styles = useStyles();

  const hasNestedStatement = (ifThenClause.statements?.length || 0) > 0;
  const ifThenClauseIndex = statement?.ifThenClauses?.indexOf(ifThenClause) ?? 0;
  const isRoot = statement.id === 'root';
  const label = ifThenClauseIndex === 0 ? (isRoot ? 'If' : 'And if') : 'Else if';

  const missingStatementWarning = ifThenClauseMissingStatementWarning(ifThenClause, statement);
  const disabledIfConditionWarning = ifThenClauseDisabledIfConditionWarning(
    ifThenClause,
    expTreeInclude,
    expTreeExclude
  );

  const handleToggleNestedStatements = (): void => {
    const newErrorStatement = _.cloneDeep(errorStatement);
    const statementRef = getStatementById(newErrorStatement, statement.id);
    if (statementRef && statementRef.ifThenClauses) {
      statementRef.ifThenClauses[index].thenClause = '';
      if (hasNestedStatement) {
        statementRef.ifThenClauses[index].statements = [];
      } else {
        if (!statementRef.ifThenClauses[index].statements) {
          statementRef.ifThenClauses[index].statements = [];
        }
        (statementRef.ifThenClauses[index].statements as ErrorStatement[]).push(generateErrorStatement());
      }
      handleUpdateErrorStatement(newErrorStatement);
    }
  };

  return (
    <div className={clsx(!isRoot && styles.errorStatementContent, !isRoot && styles.errorStatementContentIndent)}>
      {missingStatementWarning && (
        <div className={styles.warningBanner}>
          <Alert severity="error">
            You need {missingStatementWarning === 'Then' ? 'a' : 'an'}{' '}
            <span className={styles.warningTag}>{missingStatementWarning}</span> statement
          </Alert>
        </div>
      )}

      {disabledIfConditionWarning && (
        <div className={styles.warningBanner}>
          <Alert severity="error">
            You have selected the disabled option "{disabledIfConditionWarning}". Please selected a different option.
          </Alert>
        </div>
      )}

      <div className={styles.errorStatementHeader}>
        <ErrorStatementLabel text={label} />

        <IfConditionSelect
          handleDeleteIfThenClause={handleDeleteIfThenClause}
          handleUpdateErrorStatement={handleUpdateErrorStatement}
          ifThenClauseIndex={index}
          ifCondition={ifThenClause.ifCondition}
          statement={statement}
        />
      </div>

      <div className={clsx(styles.errorStatementContent, styles.errorStatementContentIndent)}>
        <Button
          className={styles.errorStatementButton}
          color="primary"
          disabled={!ifThenClause.ifCondition?.value}
          onClick={handleToggleNestedStatements}
          variant="contained"
        >
          {hasNestedStatement ? 'Remove nested statements' : 'And also if...'}
        </Button>
      </div>

      {hasNestedStatement &&
        (ifThenClause.statements as ErrorStatement[])?.map(childStatement => (
          <NestedErrorStatement
            key={childStatement.id}
            handleUpdateErrorStatement={handleUpdateErrorStatement}
            parentStatement={statement}
            statement={childStatement}
          />
        ))}

      {!hasNestedStatement && (
        <ThenClause
          handleUpdateErrorStatement={handleUpdateErrorStatement}
          ifThenClauseIndex={index}
          statementId={statement.id || ''}
          thenClause={ifThenClause.thenClause || ''}
        />
      )}
    </div>
  );
};

export default IfThenClause;
