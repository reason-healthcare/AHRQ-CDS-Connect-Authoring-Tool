import React from 'react';
import { useSelector } from 'react-redux';
import { Button, TextField } from '@mui/material';
import clsx from 'clsx';
import _ from 'lodash';

import ErrorStatementLabel from './ErrorStatementLabel';
import { generateIfThenClause, getStatementById } from './utils';
import useStyles from './styles';
import type { ErrorStatement } from 'types/artifact';

interface ElseClauseProps {
  handleUpdateErrorStatement: (errorStatement: ErrorStatement) => void;
  statement: ErrorStatement;
}

const ElseClause: React.FC<ElseClauseProps> = ({ handleUpdateErrorStatement, statement }) => {
  const artifact = useSelector(
    (state: { artifacts: { artifact: { errorStatement: ErrorStatement } } }) => state.artifacts.artifact
  );
  const { errorStatement } = artifact;
  const isRoot = statement.id === 'root';
  const styles = useStyles();

  const handleAddIfThenClause = (): void => {
    const newErrorStatement = _.cloneDeep(errorStatement);
    const statementRef = getStatementById(newErrorStatement, statement.id || '');
    if (statementRef) {
      if (!statementRef.ifThenClauses) {
        statementRef.ifThenClauses = [];
      }
      statementRef.ifThenClauses.push(generateIfThenClause());
      handleUpdateErrorStatement(newErrorStatement);
    }
  };

  const handleUpdateElseClause = (newValue: string): void => {
    const newErrorStatement = _.cloneDeep(errorStatement);
    const statementRef = getStatementById(newErrorStatement, statement.id || '');
    if (statementRef) {
      statementRef.elseClause = newValue;
      handleUpdateErrorStatement(newErrorStatement);
    }
  };

  return (
    <div className={clsx(!isRoot && styles.errorStatementContent, !isRoot && styles.errorStatementContentIndent)}>
      <div className={styles.errorStatementButtonElse}>
        <Button
          color="primary"
          disabled={statement.ifThenClauses?.some(ifThenClause => !ifThenClause.ifCondition?.label) || false}
          onClick={handleAddIfThenClause}
          variant="contained"
        >
          Or else if...
        </Button>
      </div>

      <div className={styles.errorStatementHeader}>
        <ErrorStatementLabel text="Else" />
      </div>

      <div className={styles.errorStatementContent}>
        <TextField
          fullWidth
          hiddenLabel
          inputProps={{ 'data-testid': 'else-clause-textfield' }}
          multiline
          name="text"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleUpdateElseClause(event.target.value)}
          placeholder="If none of the conditions hold..."
          value={statement.elseClause || ''}
        />
      </div>
    </div>
  );
};

export default ElseClause;
