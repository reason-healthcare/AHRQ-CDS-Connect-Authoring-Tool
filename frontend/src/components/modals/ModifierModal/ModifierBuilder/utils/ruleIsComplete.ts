import type { Rule, Operand } from '../../types';

const operandComplete = (rule: Rule, operand: Operand): boolean => {
  if (operand.typeSpecifier?.requiredFields) {
    return (
      Boolean(rule[operand.id]) &&
      operand.typeSpecifier.requiredFields.every(field =>
        Boolean((rule[operand.id] as Record<string, unknown>)?.[field])
      )
    );
  } else {
    return Boolean(rule[operand.id]);
  }
};

const ruleIsComplete = (rule: Rule): boolean => {
  const isConjunction = Boolean(rule.conjunctionType);
  const operandsAreComplete = rule.operator?.userSelectedOperands?.every(
    operand =>
      (Array.isArray(rule[operand.id]) && (rule[operand.id] as unknown[]).length > 0) ||
      (!Array.isArray(rule[operand.id]) && operandComplete(rule, operand))
  );

  if (isConjunction) {
    return (rule.rules?.length ?? 0) > 0;
  } else {
    return (
      Boolean(rule.resourceProperty) &&
      Boolean(rule.operator) &&
      (!rule.operator.userSelectedOperands || operandsAreComplete)
    );
  }
};

export default ruleIsComplete;
