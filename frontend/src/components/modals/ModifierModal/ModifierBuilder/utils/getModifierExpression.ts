import { changeToCase } from 'utils/strings';
import ruleIsComplete from './ruleIsComplete';
import type { Rule, Operand, ModifierTree } from '../../types';

const getOperandExpression = (rule: Rule, operandId: string, field?: string): string => {
  let expression = '';
  const operand = rule.operator?.userSelectedOperands?.find(({ id }) => id === operandId) as Operand | undefined;

  if (!operand) return expression;

  if (operand.preLabel) expression = expression.concat(` ${operand.preLabel}`);
  if (operand.selectionValues && operand.selectionValues[0]?.label) {
    const selectedValue = operand.selectionValues.find(({ value }) => value === rule[operandId]);
    if (selectedValue) {
      expression = expression.concat(` ${changeToCase(selectedValue.label, 'noCaseWithParens')}`);
    }
  } else {
    const operandValue = rule[operandId];
    if (field && typeof operandValue === 'object' && operandValue !== null) {
      expression = expression.concat(
        ` ${(operandValue as Record<string, unknown>)[field] ?? changeToCase(String(operandValue), 'noCase')}`
      );
    } else {
      expression = expression.concat(` ${changeToCase(String(operandValue ?? ''), 'noCase')}`);
    }
  }
  if (operand.postLabel) expression = expression.concat(` ${operand.postLabel}`);

  return expression;
};

const getRuleExpression = (rule: Rule): string => {
  let expression = '';

  if (ruleIsComplete(rule) && rule.resourceProperty && rule.operator) {
    // property and operator
    expression = expression.concat(
      `${changeToCase(rule.resourceProperty, 'capitalCase')} ${
        rule.operator.displayName ?? changeToCase(rule.operator.name ?? '', 'noCase')
      }`
    );

    // concepts operand
    if (rule.conceptValue || (rule.conceptValues && rule.conceptValues.length > 0)) {
      let conceptExpression = '';
      const concepts = rule.conceptValues || (rule.conceptValue ? [rule.conceptValue] : []);
      concepts.forEach((concept, index) => {
        conceptExpression = conceptExpression.concat(
          concept.display ? `"${concept.display}"` : `${concept.system} ${concept.code}`
        );
        if (index !== concepts.length - 1) conceptExpression = conceptExpression.concat(', ');
      });
      expression = expression.concat(` [${conceptExpression}]`);
    }

    // valueset operand
    if (rule.valueset?.name) expression = expression.concat(` [${rule.valueset.name}]`);

    // codeValue operand
    if (rule.codeValue && Array.isArray(rule.codeValue)) {
      let codeValueExpression = '';
      rule.codeValue.forEach((value, index) => {
        const valueStr =
          typeof value === 'object' && value !== null && 'inputValue' in value ? value.inputValue : String(value);
        codeValueExpression = codeValueExpression.concat(valueStr ?? '');
        if (index < rule.codeValue!.length - 1) codeValueExpression = codeValueExpression.concat(', ');
      });
      expression = expression.concat(` [${codeValueExpression}]`);
    }

    // all other operands
    if (!rule.conceptValue && !rule.conceptValues && !rule.valueset && !rule.codeValue) {
      rule.operator?.userSelectedOperands?.forEach(operand => {
        if (rule[operand.id]) {
          expression = expression.concat(
            ` ${getOperandExpression(rule, operand.id, operand.typeSpecifier?.displayField)}`
          );
        }
      });
    }
  }

  return expression;
};

const getRulesExpression = (rules: Rule[], conjunctionType: 'and' | 'or'): string => {
  let expression = '';

  rules.forEach((rule, index) => {
    const isComplete = rule.rules
      ? rule.rules.length > 0 && rule.rules.every(r => ruleIsComplete(r))
      : ruleIsComplete(rule);

    const previousIsComplete = rules[index - 1]?.rules
      ? rules[index - 1].rules.every(r => ruleIsComplete(r))
      : ruleIsComplete(rules[index - 1] ?? ({} as Rule));

    if (rules.length > 1 && index > 0 && isComplete) {
      expression = expression.concat(` ${changeToCase(conjunctionType, 'constantCase')} `);
    }

    expression = expression.concat(getRuleExpression(rule));

    if (rule.rules) {
      expression = expression.concat(
        `${isComplete && previousIsComplete ? '(' : ''}${getRulesExpression(rule.rules, rule.conjunctionType ?? 'and')}${
          isComplete && previousIsComplete ? ')' : ''
        }`
      );
    }
  });

  return expression;
};

const getModifierExpression = (modifierTree: ModifierTree): string => {
  return getRulesExpression(modifierTree.where.rules, modifierTree.where.conjunctionType);
};

export default getModifierExpression;
