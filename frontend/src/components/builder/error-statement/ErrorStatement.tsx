import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader } from '@mui/material';

import NestedErrorStatement from './NestedErrorStatement';
import useStyles from './styles';
import type { ErrorStatement } from 'types/artifact';

interface ErrorStatementProps {
  handleUpdateErrorStatement: (errorStatement: ErrorStatement) => void;
}

const ErrorStatementComponent: React.FC<ErrorStatementProps> = ({ handleUpdateErrorStatement }) => {
  const artifact = useSelector(
    (state: { artifacts: { artifact: { errorStatement?: ErrorStatement } } }) => state.artifacts.artifact
  );
  const { errorStatement } = artifact;
  const styles = useStyles();

  if (!errorStatement) {
    return null;
  }

  return (
    <Card>
      <CardHeader title="Handle Errors" />

      <CardContent className={styles.errorStatement}>
        <NestedErrorStatement handleUpdateErrorStatement={handleUpdateErrorStatement} statement={errorStatement} />
      </CardContent>
    </Card>
  );
};

export default ErrorStatementComponent;
