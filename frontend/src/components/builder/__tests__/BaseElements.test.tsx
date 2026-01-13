import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';

import BaseElements from '../BaseElements';
import { render, screen, userEvent, waitFor } from 'utils/test-utils';
import {
  elementGroups,
  genericBaseElementInstance,
  genericBaseElementListInstance,
  genericInstance
} from 'utils/test_fixtures';
import { createTemplateInstance } from 'utils/test_helpers';
import { mockArtifact } from 'mocks/artifacts';
import { mockExternalCqlLibrary } from 'mocks/external-cql';
import { mockTemplates } from 'mocks/templates';
import mockModifiers from 'mocks/modifiers/mockModifiers';
import type { Instance } from 'utils/instances';

interface RootState {
  [key: string]: unknown;
}

interface RenderComponentProps {
  baseElements?: Instance[];
  addBaseElement?: jest.Mock;
  addInstance?: jest.Mock;
  deleteInstance?: jest.Mock;
  editInstance?: jest.Mock;
  updateBaseElementLists?: jest.Mock;
  updateInstanceModifiers?: jest.Mock;
  validateReturnType?: boolean;
  [key: string]: unknown;
}

describe('<BaseElements />', () => {
  const renderComponent = ({ baseElements = [], ...props }: RenderComponentProps = {}) =>
    render(
      <Provider
        store={createStore((x: RootState) => x, {
          artifacts: { artifact: { ...mockArtifact, baseElements } },
          vsac: { apiKey: '1234' }
        } as RootState)}
      >
        <BaseElements
          addBaseElement={jest.fn()}
          addInstance={jest.fn()}
          deleteInstance={jest.fn()}
          editInstance={jest.fn()}
          updateBaseElementLists={jest.fn()}
          updateInstanceModifiers={jest.fn()}
          validateReturnType={false}
          {...props}
        />
      </Provider>
    );

  beforeEach(() => {
    nock('http://localhost')
      .persist()
      .get(`/authoring/api/externalCQL/${mockArtifact._id}`)
      .reply(200, [mockExternalCqlLibrary])
      .get(`/authoring/api/modifiers/${mockArtifact._id}`)
      .reply(200, mockModifiers)
      .get('/authoring/api/config/templates')
      .reply(200, mockTemplates);
  });

  afterEach(() => nock.cleanAll());

  afterAll(() => nock.restore());

  it('should render separate non-list elements', () => {
    const genericBaseElementInstanceWithoutUsedBy1 = createTemplateInstance(genericBaseElementInstance);
    (
      genericBaseElementInstanceWithoutUsedBy1 as typeof genericBaseElementInstanceWithoutUsedBy1 & {
        usedBy: unknown[];
      }
    ).usedBy = [];
    genericBaseElementInstanceWithoutUsedBy1.uniqueId = 'base-el-1';
    const genericBaseElementInstanceWithoutUsedBy2 = createTemplateInstance(genericBaseElementInstance);
    (
      genericBaseElementInstanceWithoutUsedBy2 as typeof genericBaseElementInstanceWithoutUsedBy2 & {
        usedBy: unknown[];
      }
    ).usedBy = [];
    genericBaseElementInstanceWithoutUsedBy2.uniqueId = 'base-el-2';

    const baseElements = [
      genericBaseElementInstanceWithoutUsedBy1,
      genericBaseElementInstanceWithoutUsedBy2
    ] as Instance[];

    const { container } = renderComponent({ baseElements });

    const templateInstanceHeaders = container.querySelectorAll('.MuiCardHeader-root');
    expect(templateInstanceHeaders).toHaveLength(2);
    expect(templateInstanceHeaders[0]).toHaveTextContent('Observation');
    expect(templateInstanceHeaders[1]).toHaveTextContent('Observation');
  });

  it('should render a list group with an element inside', async () => {
    const baseElement = createTemplateInstance(genericBaseElementListInstance);
    baseElement.childInstances = [genericInstance] as typeof baseElement.childInstances;
    const baseElements = [baseElement] as Instance[];

    const { getAllByTestId } = renderComponent({ baseElements });

    // ListGroup renders a ConjunctionGroup
    const conjunctions = getAllByTestId('group-element');
    expect(conjunctions).toHaveLength(1);

    // ConjunctionGroup renders a TemplateInstance and an ElementSelect
    const [conjunctionGroup] = conjunctions;
    const expressPhrase = conjunctionGroup.querySelectorAll(
      '[class^="ElementCard-expressionTag"], [class^="ElementCard-expressionText"]'
    );

    expect(expressPhrase[0]).toHaveTextContent('Union');
    expect(expressPhrase[1]).toHaveTextContent('of');
    expect(expressPhrase[2]).toHaveTextContent('VSAC Observation');

    // The Type options in the Conjunction group match the List options, not the usual operations
    await waitFor(() => userEvent.click(screen.getByRole('combobox', { name: '' })));

    const listOperations = elementGroups[3].entries;
    await waitFor(() => {
      const menuOptions = screen.getAllByRole('option');
      expect(menuOptions).toHaveLength(2);
      expect(menuOptions[0]).toHaveTextContent(listOperations[0].name);
      expect(menuOptions[1]).toHaveTextContent(listOperations[1].name);
    });
  });

  it('should render ElementSelect to add new base elements', () => {
    const { getByLabelText } = renderComponent({});
    expect(getByLabelText('Element type')).toBeInTheDocument();
  });

  it('should call addBaseElement when adding a new base element', async () => {
    const addBaseElement = jest.fn();
    const { getByLabelText, getByRole } = renderComponent({ addBaseElement, baseElements: [] });

    const elementSelect = getByLabelText('Element type');
    await userEvent.click(elementSelect);
    await waitFor(() => userEvent.click(getByRole('option', { name: /demographics/i })));
    await waitFor(() => userEvent.click(getByLabelText('Demographics Element')));
    await waitFor(() => userEvent.click(getByRole('option', { name: /age range/i })));
    expect(addBaseElement).toHaveBeenCalledTimes(1);
    const ageRangeElement = {
      fields: [
        { id: 'element_name', name: 'Element Name', type: 'string' },
        { id: 'comment', name: 'Comment', type: 'textarea' },
        { id: 'min_age', name: 'Minimum Age', type: 'number', typeOfNumber: 'integer' },
        { id: 'max_age', name: 'Maximum Age', type: 'number', typeOfNumber: 'integer' },
        { id: 'unit_of_time', name: 'Unit of Time', select: 'demographics/units_of_time', type: 'valueset' }
      ],
      uniqueId: 'AgeRange-TEST-1',
      id: 'AgeRange',
      name: 'Age Range',
      path: '',
      returnType: 'boolean',
      suppressedModifiers: ['BooleanNot', 'BooleanComparison'],
      validator: { fields: ['unit_of_time', 'min_age', 'max_age'], type: 'requiredIfThenOne' }
    };
    expect(addBaseElement).toHaveBeenCalledWith(ageRangeElement);
  });

  it('should call updateBaseElementLists when changing base element lists', async () => {
    const updateBaseElementLists = jest.fn();
    const baseElement = createTemplateInstance(genericBaseElementListInstance);
    baseElement.childInstances = [genericInstance] as typeof baseElement.childInstances;
    const baseElements = [baseElement] as Instance[];

    const { getByTestId } = renderComponent({ updateBaseElementLists, baseElements });

    const groupElement = getByTestId('group-element').parentNode?.parentNode as HTMLElement;
    const nameInput = groupElement.querySelector('input[type="text"]') as HTMLInputElement;
    await userEvent.type(nameInput, 'new list name');
    await waitFor(() => {
      expect(updateBaseElementLists).toHaveBeenCalled();
    });
  });

  it('should call updateBaseElementLists when deleting a base element list', async () => {
    const updateBaseElementLists = jest.fn();
    const baseElement = createTemplateInstance(genericBaseElementListInstance);
    baseElement.childInstances = [genericInstance] as typeof baseElement.childInstances;
    (baseElement as typeof baseElement & { usedBy: unknown[] }).usedBy = [];
    const baseElements = [baseElement] as Instance[];

    const { getByRole } = renderComponent({ updateBaseElementLists, baseElements });

    await waitFor(() => userEvent.click(getByRole('button', { name: /delete list group/i })));
    await waitFor(() => userEvent.click(getByRole('button', { name: 'Delete' })));
    expect(updateBaseElementLists).toHaveBeenCalledTimes(1);
  });
});
