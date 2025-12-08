import React from 'react';
import _ from 'lodash';

import convertToExpression from 'utils/artifacts/convertToExpression';
import { getOriginalBaseElement, getAllModifiersOnBaseElementUse } from 'utils/baseElements';
import { getReturnType, getFieldWithId, getFieldWithType } from 'utils/instances';
import { ElementExpressionPhrase } from 'components/elements/ElementCard';
import type { Instance } from '../../utils/instances';

interface ExpressionPhraseProps {
  baseElements: Instance[];
  instance: Instance;
  closed?: boolean;
  inModal?: boolean;
}

interface ExpressionSentenceValue {
  modifierText?: string;
  leadingText?: string;
  type?: string;
  id?: string;
  label?: string;
  isTag?: boolean;
  isType?: boolean;
  isName?: boolean;
  tooltipText?: string;
  modifierExpression?: string;
}

const ExpressionPhrase: React.FC<ExpressionPhraseProps> = ({ baseElements, instance, closed, inModal }) => {
  const getExpressionPhrase = (inst: Instance): ExpressionSentenceValue[] => {
    let returnType = inst.returnType;
    if (!_.isEmpty(inst.modifiers)) {
      returnType = getReturnType(inst.returnType, inst.modifiers);
    }

    let phraseTemplateInstance = inst;
    let phraseTemplateInstanceIsConjunction = false;
    if (inst.type === 'baseElement') {
      const referenceField = getFieldWithType(inst.fields, 'reference');
      if (referenceField) {
        // Use the original base element as a base, but include all modifiers from derivative uses.
        const originalBaseElement = _.cloneDeep(getOriginalBaseElement(inst, baseElements));
        const modifiers = getAllModifiersOnBaseElementUse(inst, baseElements, []);
        originalBaseElement.modifiers = modifiers;
        phraseTemplateInstance = originalBaseElement;
      }
    }

    if (phraseTemplateInstance.conjunction) {
      phraseTemplateInstanceIsConjunction = true;
    }

    let modifiers = phraseTemplateInstance.modifiers || [];
    const elementNamesInPhrase: Array<{ name: string; tooltipText: string }> = [];
    if (inst.type === 'baseElement') {
      const baseElementModifiers = inst.modifiers || [];
      modifiers = modifiers.concat(baseElementModifiers);
    }
    let type =
      phraseTemplateInstance.type === 'parameter' ? phraseTemplateInstance.type : phraseTemplateInstance.name || '';

    if (phraseTemplateInstance.type === 'externalCqlElement') {
      type =
        (phraseTemplateInstance as { template?: string }).template === 'GenericStatement'
          ? 'externalCqlStatement'
          : 'externalCqlFunction';
    }

    if ((phraseTemplateInstance as { subpopulationName?: string }).subpopulationName && type === '') {
      // Subpopulation type not selected yet
      type = phraseTemplateInstance.id || '';
    }

    let valueSets: Array<{ name: string; oid: string }> = [];
    const phraseTemplateInstanceVsacField = getFieldWithType(phraseTemplateInstance.fields, '_vsac');
    if (
      phraseTemplateInstanceVsacField &&
      (phraseTemplateInstanceVsacField as { valueSets?: Array<{ name: string; oid: string }> }).valueSets
    ) {
      valueSets = (phraseTemplateInstanceVsacField as { valueSets: Array<{ name: string; oid: string }> }).valueSets;
    }

    let codes: Array<{ code: string; codeSystem: { name: string; id?: string } }> = [];
    if (
      phraseTemplateInstanceVsacField &&
      (
        phraseTemplateInstanceVsacField as {
          codes?: Array<{ code: string; codeSystem: { name: string; id?: string } }>;
        }
      ).codes
    ) {
      codes =
        (
          phraseTemplateInstanceVsacField as {
            codes: Array<{ code: string; codeSystem: { name: string; id?: string } }>;
          }
        ).codes || [];
    }

    const otherFields = (phraseTemplateInstance.fields || []).filter(
      field => field.type === 'number' || field.type === 'valueset'
    );

    if (phraseTemplateInstanceIsConjunction) {
      (phraseTemplateInstance.childInstances || []).forEach(child => {
        let secondPhraseExpressions: ExpressionSentenceValue[] = [];
        if (child.childInstances && phraseTemplateInstance.usedBy) {
          // Groups expression phrases list the names of the elements within the group. They only go one level deep.
          const childNames = (child.childInstances || []).map(c => {
            const nameField = getFieldWithId(c.fields, 'element_name');
            return { name: (nameField as { value?: string })?.value || '' };
          });
          secondPhraseExpressions = convertToExpression(
            [],
            child.name || '',
            [],
            [],
            child.returnType || '',
            [],
            childNames
          ) as ExpressionSentenceValue[];
        } else {
          // Individual elements give the full expression phrase in the tooltip
          secondPhraseExpressions = getExpressionPhrase(child);
        }
        const phraseArrayAsSentence = secondPhraseExpressions.reduce(
          (acc, currentValue) =>
            `${acc}${currentValue.label === ',' ? '' : ' '}
          ${currentValue.isName ? '"' : ''}${currentValue.label || ''}${currentValue.isName ? '"' : ''}`,
          ''
        );
        const nameField = getFieldWithId(child.fields, 'element_name');
        elementNamesInPhrase.push({
          name: (nameField as { value?: string })?.value || '',
          tooltipText: phraseArrayAsSentence
        });
      });
    }

    const isBaseElementAndOr =
      phraseTemplateInstanceIsConjunction &&
      inst.type === 'baseElement' &&
      (phraseTemplateInstance.name === 'And' || phraseTemplateInstance.name === 'Or');

    let referenceElementName: string | null = null;
    if (type === 'parameter') {
      referenceElementName = phraseTemplateInstance.name || null;
    } else if (type === 'externalCqlStatement' || type === 'externalCqlFunction') {
      const referenceField = getFieldWithId(phraseTemplateInstance.fields, 'externalCqlReference');
      referenceElementName = (referenceField as { value?: { element?: string } })?.value?.element || null;
    }

    const expressions = convertToExpression(
      modifiers as Array<{
        id: string;
        name: string;
        type?: string;
        validator?: { type: string; fields: string[]; args?: string[] };
        values?: Record<string, unknown>;
      }>,
      type,
      valueSets,
      codes,
      returnType || '',
      otherFields,
      elementNamesInPhrase,
      isBaseElementAndOr,
      referenceElementName
    ) as ExpressionSentenceValue[];

    return expressions;
  };

  const expressions = getExpressionPhrase(instance);
  const hasElements = expressions.some(expression => expression.isTag);

  if (!expressions || !hasElements) {
    return null;
  }

  return <ElementExpressionPhrase closed={closed} expressions={expressions} inModal={inModal} />;
};

export default ExpressionPhrase;
