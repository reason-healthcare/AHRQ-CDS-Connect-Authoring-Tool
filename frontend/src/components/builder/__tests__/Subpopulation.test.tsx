import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { render, fireEvent, userEvent, screen, waitFor } from 'utils/test-utils';
import Subpopulation from '../Subpopulation';
import { mockArtifact } from 'mocks/artifacts';
import { mockExternalCqlLibrary } from 'mocks/external-cql';
import { mockTemplates } from 'mocks/templates';
import { getSubpopulationErrors, hasGroupNestedWarning } from 'utils/warnings';
import type { Instance } from 'utils/instances';
import type { Alert } from 'utils/warnings';

interface SubpopulationType extends Instance {
  subpopulationName?: string;
  expanded?: boolean;
}

const subpopulationName = 'First Subpopulation';
const subpopulation: SubpopulationType = {
  id: 'And',
  name: 'And',
  conjunction: true,
  returnType: 'boolean',
  fields: [
    { id: 'element_name', type: 'string', name: 'Group Name' },
    { id: 'comment', type: 'string', name: 'Comment' }
  ],
  uniqueId: 'foo123',
  childInstances: [],
  path: '',
  subpopulationName,
  expanded: true
};

interface RootState {
  [key: string]: unknown;
}

interface RenderComponentProps {
  addInstance?: jest.Mock;
  alerts?: Alert[];
  deleteInstance?: jest.Mock;
  disableDeleteSubpopulationElement?: boolean;
  editInstance?: jest.Mock;
  handleDeleteSubpopulationElement?: jest.Mock;
  handleUpdateSubpopulationElement?: jest.Mock;
  hasErrors?: boolean;
  subpopulation?: SubpopulationType;
  subpopulationUniqueId?: string;
  updateInstanceModifiers?: jest.Mock;
  [key: string]: unknown;
}

describe('<Subpopulation />', () => {
  const renderComponent = (props: RenderComponentProps = {}) =>
    render(
      <Provider
        store={createStore((x: RootState) => x, {
          artifacts: { artifact: mockArtifact },
          vsac: { apiKey: 'api-123' }
        } as RootState)}
      >
        <Subpopulation
          addInstance={jest.fn()}
          alerts={[]}
          deleteInstance={jest.fn()}
          disableDeleteSubpopulationElement={false}
          editInstance={jest.fn()}
          handleDeleteSubpopulationElement={jest.fn()}
          handleUpdateSubpopulationElement={jest.fn()}
          hasErrors={false}
          subpopulation={subpopulation}
          subpopulationUniqueId={'subpop-1'}
          updateInstanceModifiers={jest.fn()}
          {...props}
        />
      </Provider>
    );

  beforeEach(() => {
    nock('http://localhost')
      .persist()
      .get(`/authoring/api/externalCQL/${mockArtifact._id}`)
      .reply(200, [mockExternalCqlLibrary])
      .get('/authoring/api/config/templates')
      .reply(200, mockTemplates);
  });

  afterEach(() => nock.cleanAll());

  afterAll(() => nock.restore());

  it('starts expanded if expanded property is set to true on subpopulation object', () => {
    const { getByText } = renderComponent();

    expect(getByText('Subpopulation:')).toBeInTheDocument();
  });

  it('can be expanded and collapsed via header', async () => {
    const { queryByText, getByText } = renderComponent();

    await waitFor(() => userEvent.click(screen.queryAllByRole('button', { name: /collapse/i })[0]));
    expect(queryByText('Subpopulation:')).not.toBeInTheDocument(); // Type is displayed next to title text box
    expect(getByText('First Subpopulation:')).toBeInTheDocument(); // Title is displayed when collapsed

    await waitFor(() => userEvent.click(screen.queryAllByRole('button', { name: /expand/i })[0]));
    expect(getByText('Subpopulation:')).toBeInTheDocument(); // Type is displayed next to title text box
    expect(queryByText('First Subpopulation:')).not.toBeInTheDocument(); // Title is not displayed when expanded
  });

  it('calls handleUpdateSubpopulationElement when the subpopulation name is changed', () => {
    const handleUpdateSubpopulationElement = jest.fn();
    const { container } = renderComponent({ handleUpdateSubpopulationElement });

    const input = container.querySelector('input[type=text]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New name' } });

    expect(handleUpdateSubpopulationElement).toHaveBeenCalledWith('New name', subpopulation.uniqueId);
  });

  it('calls handleDeleteSubpopulationElement when the subpopulation is deleted', async () => {
    const handleDeleteSubpopulationElement = jest.fn();
    const { getByRole } = renderComponent({ handleDeleteSubpopulationElement });

    await waitFor(() => userEvent.click(getByRole('button', { name: 'delete Subpopulation' }))); // delete button on subpopulation
    await waitFor(() => userEvent.click(getByRole('button', { name: 'Delete' }))); // modal delete

    expect(handleDeleteSubpopulationElement).toHaveBeenCalledWith(subpopulation.uniqueId);
  });

  it('renders an element select inside the subpopulation', async () => {
    const { getAllByLabelText } = renderComponent();

    await waitFor(() => {
      expect(getAllByLabelText(/select element type/i)).toHaveLength(1);
    });
  });

  it('renders a conjunction group with nested elements inside the subpopulation', async () => {
    const element1: Instance = {
      uniqueId: 'el-1',
      id: 'GenericProcedure_vsac',
      name: 'Procedure',
      type: 'element',
      returnType: 'list_of_procedures',
      fields: [
        { id: 'element_name', type: 'string', name: 'Element Name', value: 'Element1' },
        { id: 'comment', type: 'textarea', name: 'Comment' },
        {
          id: 'procedure',
          type: 'procedure_vsac',
          name: 'Procedure',
          static: true,
          valueSets: []
        }
      ],
      modifiers: []
    };
    const element2: Instance = {
      id: 'And',
      name: 'And',
      conjunction: true,
      returnType: 'boolean',
      uniqueId: 'And-1',
      fields: [
        { id: 'element_name', type: 'string', name: 'Group Name', value: 'Group1' },
        { id: 'comment', type: 'string', name: 'Comment', value: 'Includes a comment' }
      ],
      childInstances: [
        {
          ...element1,
          uniqueId: 'el-2',
          fields: [
            { id: 'element_name', type: 'string', name: 'Element Name', value: 'Element2' },
            { id: 'comment', type: 'textarea', name: 'Comment' },
            {
              id: 'procedure',
              type: 'procedure_vsac',
              name: 'Procedure',
              static: true,
              valueSets: []
            }
          ]
        }
      ]
    };

    const subpopulationWithChildren: SubpopulationType = {
      ...subpopulation,
      childInstances: [element1, element2]
    };
    const { getAllByText, getAllByRole } = renderComponent({
      subpopulation: subpopulationWithChildren
    });

    await waitFor(() => {
      expect(getAllByText('Procedure:')).toHaveLength(2); // One top level procedure, one in the group
      expect(getAllByText('Group:')).toHaveLength(1); // One group
      expect(getAllByRole('combobox', { name: '' })).toHaveLength(3); // Two "And" dropdowns on top level subpopulation groups and one from Group
    });
  });

  it('displays an alert if no elements are inside the subpopulation', () => {
    const alerts = getSubpopulationErrors(subpopulation, [], []);
    const { getByText } = renderComponent({ alerts });
    expect(getByText('Warning: This subpopulation needs at least one element.')).toBeInTheDocument();
  });

  it('displays an alert if a duplicate name is on the subpopulation', () => {
    const alerts = getSubpopulationErrors(
      subpopulation,
      [],
      [
        { name: 'First Subpopulation', id: 'foo123' }, // The subpopulation
        { name: 'First Subpopulation', id: 'not-foo123' } // Another element with the same name
      ]
    );
    const { getByText } = renderComponent({ alerts });
    expect(getByText(/Warning: Name already in use/i)).toBeInTheDocument();
  });

  it('displays an alert if a subpopulation is used in a recommendation', () => {
    const alerts = getSubpopulationErrors(subpopulation, [{ subpopulations: [{ uniqueId: 'foo123' }] }], []);
    const { getByText } = renderComponent({ alerts });
    expect(
      getByText(/Subpopulation name can't be changed while it is being used in a recommendation/i)
    ).toBeInTheDocument();
  });

  it('displays an alert if any element in the subpopulation has an error when the subpopulation is collapsed', async () => {
    const nonBooleanElement: Instance = {
      uniqueId: 'el-1',
      id: 'GenericProcedure_vsac',
      name: 'Procedure',
      type: 'element',
      returnType: 'list_of_procedures',
      fields: [
        { id: 'element_name', type: 'string', name: 'Element Name', value: 'Element1' },
        { id: 'comment', type: 'textarea', name: 'Comment' },
        {
          id: 'procedure',
          type: 'procedure_vsac',
          name: 'Procedure',
          static: true,
          valueSets: []
        }
      ],
      modifiers: []
    };
    const subpopulationWithNonBooleanElement: SubpopulationType = {
      ...subpopulation,
      childInstances: [nonBooleanElement]
    };

    // Note: these calculations are done in Subpopulations and passed in
    const alerts = getSubpopulationErrors(subpopulationWithNonBooleanElement, [], []);
    const hasNestedWarning = hasGroupNestedWarning([nonBooleanElement], [], [], [], [], true);
    const hasErrors = alerts.filter(a => a.showAlert && a.alertSeverity === 'error').length > 0 || hasNestedWarning;

    const { getByText } = renderComponent({ alerts, hasErrors, subpopulation: subpopulationWithNonBooleanElement });

    // No alerts to display on the subpopulation itself
    expect(alerts.filter(a => a.showAlert)).toHaveLength(0);

    // Collapse the Subpopulation
    await waitFor(() => userEvent.click(screen.queryAllByRole('button', { name: /collapse/i })[0]));

    expect(getByText('Has errors.')).toBeInTheDocument();
  });
});
