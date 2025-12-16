import React from 'react';
import { useSelector } from 'react-redux';
import { TextField } from '@mui/material';
import clsx from 'clsx';
import _ from 'lodash';

import ErrorStatementLabel from './ErrorStatementLabel';
import { getStatementById } from './utils';
import useStyles from './styles';
import type { ErrorStatement } from 'types/artifact';

interface ThenClauseProps {
  handleUpdateErrorStatement: (errorStatement: ErrorStatement) => void;
  ifThenClauseIndex: number;
  statementId: string;
  thenClause: string;
}

const ThenClause: React.FC<ThenClauseProps> = ({
  handleUpdateErrorStatement,
  ifThenClauseIndex,
  statementId,
  thenClause
}) => {
  const artifact = useSelector(
    (state: { artifacts: { artifact: { errorStatement: ErrorStatement } } }) => state.artifacts.artifact
  );
  const { errorStatement } = artifact;
  const styles = useStyles();

  const handleUpdateThenClause = (newValue: string): void => {
    const newErrorStatement = _.cloneDeep(errorStatement);
    const statementRef = getStatementById(newErrorStatement, statementId);
    if (statementRef && statementRef.ifThenClauses) {
      statementRef.ifThenClauses[ifThenClauseIndex].thenClause = newValue;
      handleUpdateErrorStatement(newErrorStatement);
    }
  };

  return (
    <div className={clsx(styles.errorStatementContent, styles.errorStatementContentIndent)}>
      <div className={styles.errorStatementHeader}>
        <ErrorStatementLabel text="Then" />
      </div>

      <div className={styles.errorStatementContent}>
        <TextField
          fullWidth
          hiddenLabel
          inputProps={{ 'data-testid': 'then-clause-textfield' }}
          multiline
          name="text"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleUpdateThenClause(event.target.value)}
          placeholder="Describe your error..."
          value={thenClause}
        />
      </div>
    </div>
  );
};

export default ThenClause;
