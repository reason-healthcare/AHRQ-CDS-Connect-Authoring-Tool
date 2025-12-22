import { v4 as uuidv4 } from 'uuid';
import type { ErrorStatement, ErrorStatementIfThenClause, ExpressionTree } from 'types/artifact';

export const generateIfThenClause = (): ErrorStatementIfThenClause => ({
  ifCondition: { label: null, value: null },
  statements: [],
  thenClause: ''
});

export const generateErrorStatement = (id?: string): ErrorStatement => ({
  id: id || uuidv4(),
  ifThenClauses: [generateIfThenClause()],
  elseClause: ''
});

export const getStatementById = (errorStatement: ErrorStatement, id: string): ErrorStatement | null => {
  if (errorStatement.id === id) return errorStatement;

  for (const ifThenClause of errorStatement.ifThenClauses) {
    for (const statement of ifThenClause.statements as ErrorStatement[]) {
      const foundStatement = getStatementById(statement, id);
      if (foundStatement) return foundStatement;
    }
  }

  return null;
};

export const ifThenClauseMissingStatementWarning = (
  ifThenClause: ErrorStatementIfThenClause,
  statement: ErrorStatement
): string | undefined => {
  if (ifThenClause.ifCondition?.value && ifThenClause.statements.length === 0 && ifThenClause.thenClause === '')
    return 'Then';
  else if (!ifThenClause.ifCondition?.value && (ifThenClause.thenClause !== '' || statement.elseClause !== ''))
    return 'If';
};

export const ifThenClauseDisabledIfConditionWarning = (
  ifThenClause: ErrorStatementIfThenClause,
  expTreeInclude: ExpressionTree,
  expTreeExclude: ExpressionTree
): string | undefined => {
  if (
    (ifThenClause.ifCondition?.uniqueId === 'default-subpopulation-1' && expTreeInclude.childInstances.length === 0) ||
    (ifThenClause.ifCondition?.uniqueId === 'default-subpopulation-2' && expTreeExclude.childInstances.length === 0)
  )
    return ifThenClause.ifCondition?.label;
};

export const errorStatementHasWarnings = (
  errorStatement: ErrorStatement,
  expTreeInclude: ExpressionTree,
  expTreeExclude: ExpressionTree
): boolean => {
  for (const ifThenClause of errorStatement.ifThenClauses) {
    if (
      ifThenClauseMissingStatementWarning(ifThenClause, errorStatement) ||
      ifThenClauseDisabledIfConditionWarning(ifThenClause, expTreeInclude, expTreeExclude)
    )
      return true;
    for (const statement of ifThenClause.statements as ErrorStatement[]) {
      return errorStatementHasWarnings(statement, expTreeInclude, expTreeExclude);
    }
  }
  return false;
};
