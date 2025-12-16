import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import clsx from 'clsx';
import _ from 'lodash';

import { Dropdown } from 'components/elements';
import { getStatementById } from './utils';
import { useFieldStyles } from 'styles/hooks';
import type { ErrorStatement, Parameter, Subpopulation, ExpressionTree } from 'types/artifact';

interface IfConditionOption {
  label: string;
  value: string;
  uniqueId?: string;
  isDisabled?: boolean;
}

interface IfConditionSelectProps {
  handleDeleteIfThenClause: () => void;
  handleUpdateErrorStatement: (errorStatement: ErrorStatement) => void;
  ifCondition?: { label?: string | null; value?: string | null; uniqueId?: string };
  ifThenClauseIndex: number;
  statement: ErrorStatement;
}

const IfConditionSelect: React.FC<IfConditionSelectProps> = ({
  handleDeleteIfThenClause,
  handleUpdateErrorStatement,
  ifCondition,
  ifThenClauseIndex,
  statement
}) => {
  const artifact = useSelector(
    (state: {
      artifacts: {
        artifact: {
          errorStatement: ErrorStatement;
          expTreeExclude: ExpressionTree;
          expTreeInclude: ExpressionTree;
          parameters: Parameter[];
          subpopulations: Subpopulation[];
        };
      };
    }) => state.artifacts.artifact
  );
  const { errorStatement, expTreeExclude, expTreeInclude, parameters, subpopulations } = artifact;
  const fieldStyles = useFieldStyles();

  const options = useMemo(() => {
    const subpopulationIsDisabled = (subpopulationId: string): boolean => {
      switch (subpopulationId) {
        case 'default-subpopulation-1':
          if ((expTreeInclude.childInstances?.length || 0) === 0) return true;
          break;
        case 'default-subpopulation-2':
          if ((expTreeExclude.childInstances?.length || 0) === 0) return true;
          break;
        default:
          return false;
      }
      return false;
    };

    const booleanParameterOptions: IfConditionOption[] = parameters
      .filter(parameter => parameter.name !== '' && parameter.type === 'boolean')
      .map(parameter => ({
        label: parameter.name || '',
        value: parameter.name || '',
        uniqueId: parameter.uniqueId
      }));

    const subpopulationOptions: IfConditionOption[] = subpopulations.map(subpopulation => ({
      label: subpopulation.subpopulationName || '',
      value: subpopulation.special
        ? subpopulation.special_subpopulationName || ''
        : subpopulation.subpopulationName
          ? `"${subpopulation.subpopulationName}"`
          : `"${subpopulation.uniqueId}"`,
      uniqueId: subpopulation.uniqueId,
      isDisabled: subpopulationIsDisabled(subpopulation.uniqueId || '')
    }));

    return [{ label: 'Recommendations is null', value: '"Recommendation" is null' }]
      .concat(_.sortBy(booleanParameterOptions, ['label']))
      .concat(_.sortBy(subpopulationOptions, ['label']));
  }, [expTreeExclude.childInstances?.length, expTreeInclude.childInstances?.length, parameters, subpopulations]);

  const selectedOption = options.find(({ value }) => value === ifCondition?.value);

  const handleUpdateIfCondition = (newValue: string): void => {
    const newErrorStatement = _.cloneDeep(errorStatement);
    const statementRef = getStatementById(newErrorStatement, statement.id || '');
    if (statementRef) {
      const condition = options.find(({ value }) => value === newValue);
      if (condition && statementRef.ifThenClauses) {
        statementRef.ifThenClauses[ifThenClauseIndex].ifCondition = condition;
        handleUpdateErrorStatement(newErrorStatement);
      }
    }
  };

  return (
    <>
      <Dropdown
        className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputXl)}
        hiddenLabel={Boolean(selectedOption?.value)}
        id={`condition-${statement.id}`}
        label={selectedOption?.value ? undefined : 'Choose if condition'}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleUpdateIfCondition(event.target.value)}
        options={options || []}
        value={selectedOption?.value || ''}
      />

      {(statement.ifThenClauses?.length || 0) > 1 && (
        <IconButton
          aria-label="delete-if-then-clause"
          color="primary"
          onClick={() => handleDeleteIfThenClause()}
          size="large"
        >
          <CloseIcon />
        </IconButton>
      )}
    </>
  );
};

export default IfConditionSelect;
