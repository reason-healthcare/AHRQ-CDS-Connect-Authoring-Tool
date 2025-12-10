import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconButton, Stack } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import clsx from 'clsx';

import OperandTemplate from './OperandTemplate';
import { Dropdown } from 'components/elements';
import { fetchOperators } from 'queries/modifier-builder';
import type { Operator } from '../../../../types/query';
import ruleIsComplete from './utils/ruleIsComplete';
import type { Operand, Rule, ResourceOption } from '../types';
import useStyles from '../styles';

interface RuleCardProps {
  handleRemoveRule: () => void;
  handleUpdateRule: (rule: Rule) => void;
  resourceOptions: ResourceOption[];
  rule: Rule;
}

const RuleCard: React.FC<RuleCardProps> = ({ handleRemoveRule, handleUpdateRule, resourceOptions, rule }) => {
  const styles = useStyles();
  const { resourceProperty, operator } = rule;
  const ruleOption = resourceProperty ? resourceOptions.find(({ value }) => value === resourceProperty) : null;

  const operatorsQuery = useQuery<Operator[]>({
    queryKey: ['operators', ruleOption?.typeSpecifier],
    queryFn: () => {
      if (!ruleOption?.typeSpecifier) {
        throw new Error('Type specifier required');
      }
      return fetchOperators({
        type: String(ruleOption.typeSpecifier.type ?? ''),
        elementType: String(ruleOption.typeSpecifier.editorType ?? ruleOption.typeSpecifier.type ?? '')
      });
    },
    enabled: Boolean(ruleOption)
  });

  const renderPropertySelectValue = (optionValue: string | number): string => {
    const selectedResourceOption = resourceOptions.find(({ value }) => value === optionValue);
    return `${selectedResourceOption?.labelPrefix ?? ''}${selectedResourceOption?.label ?? ''}`;
  };

  let operatorOptions: Operator[] | undefined = operatorsQuery.data;
  if (operatorOptions && ruleOption?.predefinedCodes && !ruleOption.allowsCustomCodes) {
    // Only predefined codes allowed, so filter out any operators that have concept operands not using predefined codes
    operatorOptions = operatorOptions.filter(op => {
      const userSelectedOperands = op.userSelectedOperands;
      // Operators without operands (like "is null") should be kept
      if (!Array.isArray(userSelectedOperands) || userSelectedOperands.length === 0) return true;
      const operands = userSelectedOperands as Operand[];
      const hasPredefinedCodesEditor = operands.some(operand => operand.selectionRequiresPredefinedCodes);
      const hasConceptOrValueSetEditor = operands.some(operand =>
        ['System.Concept', 'valueset'].includes(operand.typeSpecifier?.editorType as string)
      );
      return hasPredefinedCodesEditor || !hasConceptOrValueSetEditor;
    });
  } else if (operatorOptions && !ruleOption?.predefinedCodes) {
    // No predefined codes, so filter out any operators that have operands requiring predefined codes
    operatorOptions = operatorOptions.filter(op => {
      const userSelectedOperands = op.userSelectedOperands;
      // Operators without operands (like "is null") should be kept
      if (!Array.isArray(userSelectedOperands) || userSelectedOperands.length === 0) return true;
      const operands = userSelectedOperands as Operand[];
      return !operands.some(operand => operand.selectionRequiresPredefinedCodes);
    });
  }

  return (
    <div className={clsx(styles.rulesCardGroup, !ruleIsComplete(rule) && styles.rulesCardGroupIncomplete)}>
      <div className={clsx(styles.line, styles.lineHorizontal, styles.lineHorizontalRule)}></div>
      <div className={clsx(styles.line, styles.lineVertical)}></div>

      <Stack alignItems="center" direction="row" flexWrap="wrap" ml="50px" width="100%" data-testid="modifier-rule">
        <Dropdown
          label="Property"
          onChange={event => handleUpdateRule({ ...rule, resourceProperty: event.target.value as string })}
          options={
            resourceOptions as Array<
              | string
              | number
              | {
                  label?: string;
                  value: string | number;
                  [key: string]: string | number | boolean | React.ReactNode | undefined;
                }
            >
          }
          SelectProps={{
            renderValue: renderPropertySelectValue
          }}
          sx={{ marginRight: '10px', width: { xs: '300px', xxl: '400px' } }}
          value={resourceProperty ?? ''}
        />

        {resourceProperty && operatorsQuery.isSuccess && operatorOptions && (
          <Dropdown
            label="Operator"
            labelKey="name"
            onChange={event =>
              handleUpdateRule({
                ...rule,
                resourceProperty: rule.resourceProperty,
                operator: operatorOptions?.find(({ id }) => id === event.target.value)
              })
            }
            options={
              operatorOptions as Array<
                | string
                | number
                | {
                    label?: string;
                    value: string | number;
                    [key: string]: string | number | boolean | React.ReactNode | undefined;
                  }
              >
            }
            SelectProps={{}}
            sx={{ marginRight: '10px', width: { xs: '250px', xxl: '300px' } }}
            value={operator?.id ?? ''}
            valueKey="id"
          />
        )}

        {operatorsQuery.data &&
          operator &&
          operator.userSelectedOperands &&
          operator.userSelectedOperands.length > 0 && (
            <OperandTemplate
              handleUpdateRule={handleUpdateRule}
              resource={ruleOption ?? null}
              rule={rule}
              selectedOperands={operator.userSelectedOperands as Operand[]}
            />
          )}
      </Stack>

      <Stack alignSelf="flex-start" mr={1}>
        <IconButton aria-label="remove rule" onClick={handleRemoveRule}>
          <ClearIcon fontSize="small" />
        </IconButton>
      </Stack>
    </div>
  );
};

export default RuleCard;
