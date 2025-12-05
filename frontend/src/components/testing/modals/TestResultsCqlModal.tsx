import React from 'react';
import { Modal, CqlViewer } from 'components/elements';
import _ from 'lodash';
import type { PatientResult } from '../TestResults';
import type { ElmFile, CqlFile } from '../../../types/query';

interface TestResultsCqlModalProps {
  handleCloseModal: () => void;
  results: PatientResult;
  cqlFiles: CqlFile[];
  elmFiles: ElmFile[];
}

// Given a CQL execution result format it for display, returning an array of lines (since there can be more than one)
const formatResult = (result: unknown): string[] => {
  // Handle each type of result we might see. Use getters instead of constructor names since webpack may mangle names.
  if (Array.isArray(result)) {
    // It's a list of items, which we handle recursively
    let formattedResult = [
      `List of ${result.length} item${result.length === 1 ? '' : 's'}${result.length === 0 ? '' : ':'}`
    ];
    formattedResult = formattedResult.concat(result.flatMap(r => formatResult(r)));
    return formattedResult;
  } else if (
    result &&
    typeof result === 'object' &&
    ('isQuantity' in result || 'isConcept' in result || 'isCode' in result)
  ) {
    // It's a simple type where we can just show the JSON representation
    return [JSON.stringify(result)];
  } else if (
    result &&
    typeof result === 'object' &&
    typeof (result as { getTypeInfo?: () => { name?: string } }).getTypeInfo === 'function'
  ) {
    // It's a FHIR object; For patients we try to pull out the name, otherwise we just pull out the type and ID
    const typedResult = result as {
      getTypeInfo: () => { name?: string };
      name?: Array<{ given?: Array<{ value?: string }>; family?: { value?: string } }>;
      id?: { value?: string };
    };
    if (typedResult.getTypeInfo()?.name === 'Patient') {
      // NOTE: getPatientFullName operates on a different object type, so we can't use that
      const given = _.get(typedResult, 'name[0].given[0]')?.value || '';
      const family = _.get(typedResult, 'name[0].family')?.value || '';
      const name = given.length > 0 || family.length > 0 ? `${given} ${family}` : 'Unknown Name';
      return [`Patient ${name}`];
    } else {
      const type = typedResult.getTypeInfo()?.name || 'Unknown type';
      return [`${type} with ID ${typedResult.id?.value || 'unknown'}`];
    }
  } else if (result && typeof result === 'object' && 'label' in result && 'type' in result && 'url' in result) {
    // It's a link, so print a simple representation
    const linkResult = result as { label: string; type: string; url: string };
    return [`${_.upperFirst(linkResult.type)} link: [${linkResult.label}](${linkResult.url})`];
  } else if (
    result &&
    typeof result === 'object' &&
    Array.isArray((result as { actions?: Array<{ type?: string; description?: string }> }).actions)
  ) {
    // It's a suggestion, so just print a simple summary
    const suggestionResult = result as { label?: string; actions: Array<{ type?: string; description?: string }> };
    if (suggestionResult.label) {
      return [`Suggestion: "${suggestionResult.label}" with ${suggestionResult.actions.length} actions`];
    } else {
      return [`Unlabeled suggestion with ${suggestionResult.actions.length} actions`];
    }
  } else {
    // For everything else we just rely on native string conversion
    return [String(result)];
  }
};

const TestResultsCqlModal: React.FC<TestResultsCqlModalProps> = ({ handleCloseModal, results, cqlFiles, elmFiles }) => {
  // Go through all the results keys, look up the location of the key in the CQL by using the ELM, and
  // annotate the ELM with the results

  // TODO: This does not currently handle any libraries

  // Note: We assume that the CQL file we want to display is the first one present (and we find the matching
  // ELM file since they may not be in the same order)

  const cqlFile = cqlFiles[0];
  const elmFile = elmFiles.find(ef => ef.name === cqlFile.name);
  if (!elmFile) {
    return (
      <Modal
        closeButtonText="Close"
        handleCloseModal={handleCloseModal}
        handleSaveModal={handleCloseModal}
        hasCancelButton
        hideSubmitButton
        isOpen
        title="Detailed CQL Execution Results"
      >
        <div>Error: Could not find matching ELM file</div>
      </Modal>
    );
  }

  const cql = cqlFile.text.split('\n'); // It's easier to annotate the CQL if it's an array
  const elm = JSON.parse(elmFile.content); // Grab the ELM as JSON
  // Find all the statement locations in the CQL using ELM locators
  const statementLocations: Array<{ resultName: string; lastLine: number }> = [];
  for (const resultName of Object.keys(results)) {
    const statement = elm.library?.statements?.def?.find((s: { name?: string }) => s.name === resultName);
    const locator = statement?.locator;
    if (locator) {
      const lastLineStr = locator.split('-').at(-1)?.split(':').at(0);
      if (lastLineStr) {
        const lastLine = parseInt(lastLineStr, 10);
        statementLocations.push({ resultName, lastLine });
      }
    }
  }
  // We start at the end since we modify the CQL in place and that way we don't have to do line number math
  for (const { resultName, lastLine } of statementLocations.sort((a, b) => b.lastLine - a.lastLine)) {
    cql.splice(lastLine, 0, '', ...formatResult(results[resultName]).map(r => `==> ${r}`));
  }

  return (
    <Modal
      closeButtonText="Close"
      handleCloseModal={handleCloseModal}
      handleSaveModal={handleCloseModal}
      hasCancelButton
      hideSubmitButton
      isOpen
      title="Detailed CQL Execution Results"
    >
      <CqlViewer code={cql.join('\n')} />
    </Modal>
  );
};

export default TestResultsCqlModal;
