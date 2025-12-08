import React from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';

import ElseClause from './ElseClause';
import IfThenClause from './IfThenClause';
import { getStatementById } from './utils';
import type { ErrorStatement } from 'types/artifact';

interface NestedErrorStatementProps {
  handleUpdateErrorStatement: (errorStatement: ErrorStatement) => void;
  parentStatement?: ErrorStatement;
  statement: ErrorStatement;
}

const NestedErrorStatement: React.FC<NestedErrorStatementProps> = ({
  handleUpdateErrorStatement,
  parentStatement,
  statement
}) => {
  const artifact = useSelector(
    (state: { artifacts: { artifact: { errorStatement: ErrorStatement } } }) => state.artifacts.artifact
  );
  const { errorStatement } = artifact;
  const hasIfThenClauses = (statement.ifThenClauses?.length || 0) > 0;

  const handleDeleteIfThenClause = (index: number): void => {
    const newErrorStatement = _.cloneDeep(errorStatement);
    const statementRef = getStatementById(newErrorStatement, statement.id || '');
    if (statementRef && statementRef.ifThenClauses) {
      statementRef.ifThenClauses.splice(index, 1);
      handleUpdateErrorStatement(newErrorStatement);
    }
  };

  return (
    <>
      {hasIfThenClauses &&
        statement.ifThenClauses?.map((ifThenClause, index) => (
          <IfThenClause
            key={index}
            handleDeleteIfThenClause={() => handleDeleteIfThenClause(index)}
            handleUpdateErrorStatement={handleUpdateErrorStatement}
            ifThenClause={ifThenClause}
            index={index}
            statement={statement}
          />
        ))}

      <ElseClause handleUpdateErrorStatement={handleUpdateErrorStatement} statement={statement} />
    </>
  );
};

export default NestedErrorStatement;
