import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import _ from 'lodash';
import { render, fireEvent, userEvent, screen, within, waitFor } from 'utils/test-utils';
import { createTemplateInstance } from 'utils/test_helpers';
import { instanceTree, elementGroups } from 'utils/test_fixtures';
import { mockArtifact } from 'mocks/artifacts';
import { mockExternalCqlLibrary } from 'mocks/external-cql';
import { mockTemplates } from 'mocks/templates';
import mockModifiers from 'mocks/modifiers/mockModifiers';
import ConjunctionGroup from '../ConjunctionGroup';
import type { Instance } from 'utils/instances';
import { templateInstanceToInstance } from 'utils/instanceConversions';

interface RootState {
  [key: string]: unknown;
}

interface RenderComponentProps {
  groupInstance?: Instance;
  addInstance?: jest.Mock;
  baseIndentLevel?: number;
  deleteInstance?: jest.Mock;
  disableAddElement?: boolean;
  disableIndent?: boolean;
  editInstance?: jest.Mock;
  elementUniqueId?: string;
  getPath?: jest.Mock;
  instance?: Instance;
  options?: string;
  root?: boolean;
  subpopulationUniqueId?: string | null;
  treeName?: string;
  updateInstanceModifiers?: jest.Mock;
  validateReturnType?: boolean;
  [key: string]: unknown;
}

describe('<ConjunctionGroup />', () => {
  const operations = elementGroups.find(g => g.name === 'Operations');
  const orTemplate = operations?.entries.find(e => e.id === 'Or');
  const andTemplate = operations?.entries.find(e => e.id === 'And');
  const orInstance = templateInstanceToInstance(createTemplateInstance(orTemplate));
  const instance: Instance = {
    ...templateInstanceToInstance(instanceTree),
    path: '',
    childInstances: [...(instanceTree.childInstances || []).map(inst => templateInstanceToInstance(inst)), orInstance]
  };

  const renderComponent = ({ groupInstance = instance, ...props }: RenderComponentProps = {}) =>
    render(
      <Provider
        store={createStore((x: RootState) => x, {
          artifacts: { artifact: mockArtifact },
          vsac: { apiKey: '1234' }
        } as RootState)}
      >
        <ConjunctionGroup
          addInstance={jest.fn()}
          baseIndentLevel={0}
          deleteInstance={jest.fn()}
          disableAddElement={false}
          disableIndent={false}
          editInstance={jest.fn()}
          elementUniqueId=""
          getPath={jest.fn()}
          instance={groupInstance}
          options=""
          root={true}
          subpopulationUniqueId={null}
          treeName="MeetsInclusionCriteria"
          updateInstanceModifiers={jest.fn()}
          validateReturnType={false}
          {...props}
        />
      </Provider>
    );

  beforeEach(() => {
    nock('http://localhost')
      .persist()
      .get('/authoring/api/config/valuesets/demographics/units_of_time')
      .reply(200, { expansion: [] })
      .get(`/authoring/api/externalCQL/${mockArtifact._id}`)
      .reply(200, [mockExternalCqlLibrary])
      .get(`/authoring/api/modifiers/${mockArtifact._id}`)
      .reply(200, mockModifiers)
      .get('/authoring/api/config/templates')
      .reply(200, mockTemplates);
  });

  afterEach(() => nock.cleanAll());

  afterAll(() => nock.restore());

  it('applies correct nesting classes', async () => {
    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeInTheDocument();
    });

    const cardGroups = container.querySelectorAll('.card-group');
    expect(cardGroups).toHaveLength(1); // One group within Inclusions

    expect((cardGroups[0].firstChild as HTMLElement).className).toMatch(/ElementCard-odd/); // Group has the correct class applied
  });

  it('can delete group', async () => {
    const deleteInstance = jest.fn();
    renderComponent({ deleteInstance });

    // wait for templates to load so ConjunctionGroup renders
    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeInTheDocument();
    });

    await waitFor(() => userEvent.click(screen.getByLabelText('delete Group')));
    await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'Delete' })));

    expect(deleteInstance).toHaveBeenCalledWith('MeetsInclusionCriteria', '.childInstances.2');
  });

  it('edits own type', async () => {
    const editInstance = jest.fn();
    renderComponent({ editInstance });

    // wait for templates to load so ConjunctionGroup renders
    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeInTheDocument();
    });

    await waitFor(() => userEvent.click(screen.getAllByRole('combobox', { name: '' })[0]));
    await waitFor(() => userEvent.click(screen.getByRole('option', { name: 'Or' })));

    const orType = operations?.entries.find(({ id }) => id === 'Or');

    expect(editInstance).toHaveBeenCalledWith('MeetsInclusionCriteria', orType, '', true);
  });

  it('edits own name', async () => {
    const newName = 'new name';
    const editInstance = jest.fn();

    const { container } = renderComponent({ editInstance });

    // wait for templates to load so ConjunctionGroup renders
    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeInTheDocument();
    });

    const childConjunction = container.querySelector('.card-group, [class^="ElementCard-odd"]') as HTMLElement;
    const nameField = childConjunction.querySelector('input[type="text"]') as HTMLInputElement;

    fireEvent.change(nameField, { target: { value: newName } });

    expect(editInstance).toHaveBeenCalledWith(
      'MeetsInclusionCriteria',
      { element_name: newName },
      '.childInstances.2',
      false
    );
  });

  it("can't indent or outdent root group", async () => {
    const { queryByLabelText, getAllByLabelText } = renderComponent({
      // same as instance defined above but no group
      groupInstance: {
        ...templateInstanceToInstance(instanceTree),
        path: '',
        childInstances: (instanceTree.childInstances || []).map(inst => templateInstanceToInstance(inst))
      } as Instance
    });

    // wait for templates to load so ConjunctionGroup renders
    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeInTheDocument();
    });

    // Inclusions without any groups should have no outdent buttons available
    expect(queryByLabelText('Outdent')).toBeNull();
    // Top level inclusions group shouldn't have indent button and two elements in childInstances should each have an indent button.
    expect(getAllByLabelText('Indent')).toHaveLength(2);
  });

  it('can indent a child group', async () => {
    const deleteInstance = jest.fn();
    const { container } = renderComponent({ deleteInstance });

    // wait for templates to load so ConjunctionGroup renders
    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeInTheDocument();
    });

    const childConjunction = container.querySelector('.card-group') as HTMLElement;
    const indentButton = childConjunction.querySelector('button[aria-label="indent"]') as HTMLButtonElement;
    fireEvent.click(indentButton);

    const andTemplateWithId: { id: string; uniqueId: string; conjunction?: boolean } = andTemplate
      ? (andTemplate as { id: string; uniqueId: string; conjunction?: boolean })
      : { id: 'And', uniqueId: 'And-TEST-1', conjunction: false };
    const templateResult = (createTemplateInstance as any)(andTemplateWithId, [orInstance as unknown]);
    const expectedInstance = {
      ...(templateResult as any),
      uniqueId: expect.any(String)
    };

    expect(deleteInstance).toHaveBeenCalledWith('MeetsInclusionCriteria', '.childInstances.2', [
      {
        instance: expectedInstance,
        path: '',
        index: 2
      }
    ]);
  });

  it('can outdent a child group', async () => {
    const deleteInstance = jest.fn();
    const { container } = renderComponent({ deleteInstance });

    // wait for templates to load so ConjunctionGroup renders
    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeInTheDocument();
    });

    const childConjunction = container.querySelector('.card-group') as HTMLElement;
    const outdentButton = childConjunction.querySelector('button[aria-label="outdent"]') as HTMLButtonElement;
    fireEvent.click(outdentButton);

    expect(deleteInstance).toHaveBeenCalledWith('MeetsInclusionCriteria', '.childInstances.2', []);
  });

  it('has an expression phrase', async () => {
    const topLevelChildInstances = _.cloneDeep(instanceTree.childInstances || []);
    const nameField0 = topLevelChildInstances[0]?.fields?.find(f => f.id === 'element_name');
    if (nameField0) nameField0.value = 'Top Level Age';
    const nameField1 = topLevelChildInstances[1]?.fields?.find(f => f.id === 'element_name');
    if (nameField1) nameField1.value = 'Top Level LDL_Test';
    const childGroupInstance: Instance = {
      ...templateInstanceToInstance(instanceTree),
      path: '',
      childInstances: [...topLevelChildInstances, orInstance, templateInstanceToInstance(instanceTree)]
    };

    const { container } = renderComponent({ instance: childGroupInstance });

    // wait for templates to load so ConjunctionGroup renders
    await waitFor(() => {
      expect(screen.getByTestId('root')).toBeInTheDocument();
    });

    expect(container.querySelectorAll('[class^="ElementCard-expressionPhrase"]')).toHaveLength(3);
    expect(container.querySelectorAll('[class^="ElementCard-expressionPhrase"]')[1]).toHaveTextContent(
      'AgeandLDL_Test'
    );
  });

  describe('for deeper nested conjunction groups', () => {
    const ageInstance = templateInstanceToInstance(createTemplateInstance(elementGroups[0].entries[0]));
    const deeperOr = {
      ...orInstance,
      childInstances: [ageInstance]
    };
    const deeperInstance = {
      ...templateInstanceToInstance(instanceTree),
      childInstances: [deeperOr]
    };

    it('can indent a child group', async () => {
      const deleteInstance = jest.fn();
      const { container } = renderComponent({ instance: deeperInstance, deleteInstance });

      // wait for templates to load so ConjunctionGroup renders
      await waitFor(() => {
        expect(screen.getByTestId('root')).toBeInTheDocument();
      });

      const childConjunction = container.querySelector('.card-group') as HTMLElement;
      const indentButton = childConjunction.querySelector('button[aria-label="indent"]') as HTMLButtonElement;
      fireEvent.click(indentButton);

      expect(deleteInstance).toHaveBeenCalledWith('MeetsInclusionCriteria', '.childInstances.0', expect.anything());
    });

    it('can outdent a child group', async () => {
      const deleteInstance = jest.fn();
      const { container } = renderComponent({ instance: deeperInstance, deleteInstance });

      // wait for templates to load so ConjunctionGroup renders
      await waitFor(() => {
        expect(screen.getByTestId('root')).toBeInTheDocument();
      });

      const childConjunction = container.querySelector('.card-group') as HTMLElement;
      const outdentButton = childConjunction.querySelector('button[aria-label="outdent"]') as HTMLButtonElement;
      fireEvent.click(outdentButton);

      expect(deleteInstance).toHaveBeenCalledWith('MeetsInclusionCriteria', '.childInstances.0', expect.anything());
    });

    it('can indent a child TemplateInstance', async () => {
      const deleteInstance = jest.fn();
      const { container } = renderComponent({ instance: deeperInstance, deleteInstance });

      // wait for templates to load so ConjunctionGroup renders
      await waitFor(() => {
        expect(screen.getByTestId('root')).toBeInTheDocument();
      });

      const actionElement = container.querySelector(
        '.card-group .card-group-section [class^="MuiCardHeader-action"]'
      ) as HTMLElement;
      fireEvent.click(within(actionElement).getByLabelText('indent'));

      expect(deleteInstance).toHaveBeenCalledWith(
        'MeetsInclusionCriteria',
        '.childInstances.0.childInstances.0',
        expect.anything()
      );
    });

    it('can outdent a child TemplateInstance', async () => {
      const deleteInstance = jest.fn();
      const { container } = renderComponent({ instance: deeperInstance, deleteInstance });

      // wait for templates to load so ConjunctionGroup renders
      await waitFor(() => {
        expect(screen.getByTestId('root')).toBeInTheDocument();
      });

      const actionElement = container.querySelector(
        '.card-group .card-group-section [class^="MuiCardHeader-action"]'
      ) as HTMLElement;
      fireEvent.click(within(actionElement).getByLabelText('outdent'));

      expect(deleteInstance).toHaveBeenCalledWith(
        'MeetsInclusionCriteria',
        '.childInstances.0.childInstances.0',
        expect.anything()
      );
    });
  });

  describe('conjunctions that are in base elements in use', () => {
    it('cannot delete main or nested conjunctions', async () => {
      const { container } = renderComponent({ disableAddElement: true });

      // wait for templates to load so ConjunctionGroup renders
      await waitFor(() => {
        expect(screen.getByTestId('root')).toBeInTheDocument();
      });

      const cardGroupElement = container.querySelector('.card-group') as HTMLElement;
      const disabledConjunction = within(cardGroupElement);

      expect(disabledConjunction.getByRole('button', { name: 'delete Group' })).toBeDisabled();
    });

    it('cannot indent or outdent nested conjunctions', async () => {
      const { container } = renderComponent({ disableAddElement: true });

      // wait for templates to load so ConjunctionGroup renders
      await waitFor(() => {
        expect(screen.getByTestId('root')).toBeInTheDocument();
      });

      const cardGroupElement = container.querySelector('.card-group') as HTMLElement;
      const disabledConjunction = within(cardGroupElement);

      const indentButton = disabledConjunction.getByRole('button', { name: 'indent' });
      const outdentButton = disabledConjunction.getByRole('button', { name: 'outdent' });

      expect(indentButton).toBeDisabled();
      expect(outdentButton).toBeDisabled();
    });
  });
});
