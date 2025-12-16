import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { render, fireEvent, userEvent, screen, waitFor, PointerEventsCheckLevel } from 'utils/test-utils';
import Subpopulations from '../Subpopulations';
import { mockArtifact } from 'mocks/artifacts';
import { mockExternalCqlLibrary } from 'mocks/external-cql';
import { mockTemplates } from 'mocks/templates';
import type { Instance } from 'utils/instances';

interface SubpopulationType extends Instance {
  subpopulationName?: string;
  expanded?: boolean;
  special?: boolean;
  special_subpopulationName?: string;
}

const subpopulation: SubpopulationType = {
  id: 'And',
  name: '',
  conjunction: true,
  returnType: 'boolean',
  fields: [
    { id: 'element_name', type: 'string', name: 'Group Name' },
    { id: 'comment', type: 'string', name: 'Comment' }
  ],
  uniqueId: 'foo123',
  childInstances: [],
  path: '',
  subpopulationName: 'Subpopulation 1',
  expanded: true
};

const specialSubpop: SubpopulationType = {
  special: true,
  subpopulationName: "Doesn't Meet Inclusion Criteria",
  special_subpopulationName: 'not "MeetsInclusionCriteria"',
  uniqueId: 'default-subpopulation-1'
};

interface RootState {
  [key: string]: unknown;
}

interface RenderComponentProps {
  recommendations?: Array<{ text: string; subpopulations: Array<{ subpopulationName: string; uniqueId: string }> }>;
  subpopulations?: SubpopulationType[];
  updateSubpopulations?: jest.Mock;
  addInstance?: jest.Mock;
  deleteInstance?: jest.Mock;
  editInstance?: jest.Mock;
  updateInstanceModifiers?: jest.Mock;
  [key: string]: unknown;
}

describe('<Subpopulations />', () => {
  const renderComponent = ({
    recommendations = [],
    subpopulations = [specialSubpop],
    updateSubpopulations = jest.fn(),
    ...props
  }: RenderComponentProps = {}) =>
    render(
      <Provider
        store={createStore((x: RootState) => x, {
          artifacts: { artifact: { ...mockArtifact, subpopulations, recommendations } }
        } as RootState)}
      >
        <Subpopulations
          addInstance={jest.fn()}
          deleteInstance={jest.fn()}
          editInstance={jest.fn()}
          updateInstanceModifiers={jest.fn()}
          updateSubpopulations={updateSubpopulations}
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

  let origAlert: typeof window.alert;
  beforeEach(() => {
    origAlert = window.alert;
    window.alert = jest.fn();
  });
  afterEach(() => {
    window.alert = origAlert;
    origAlert = null;
  });

  it('filters out "default" subpopulations', () => {
    const { queryAllByText } = renderComponent();

    expect(queryAllByText('Subpopulation:')).toHaveLength(0);
  });

  it('can add subpopulations', async () => {
    const updateSubpopulations = jest.fn();
    renderComponent({ updateSubpopulations });

    await waitFor(() => userEvent.click(screen.getByRole('button', { name: 'New subpopulation' })));

    expect(updateSubpopulations).toHaveBeenCalledWith(
      [
        specialSubpop,
        expect.objectContaining({
          id: 'And',
          subpopulationName: 'Subpopulation 1',
          expanded: true
        })
      ],
      'subpopulations'
    );
  });

  it('can update a subpopulation name', async () => {
    const newSubpopulationName = 'New Subpopulation Name v2.0';
    const updateSubpopulations = jest.fn();
    const subpopulations = [specialSubpop, subpopulation];

    const { container } = renderComponent({
      subpopulations,
      updateSubpopulations
    });

    await waitFor(() => {
      const input = container.querySelector('input[type=text]') as HTMLInputElement;
      return fireEvent.change(input, { target: { value: newSubpopulationName } });
    });

    expect(updateSubpopulations).toHaveBeenCalledWith(
      [
        specialSubpop,
        expect.objectContaining({
          subpopulationName: newSubpopulationName
        })
      ],
      'subpopulations'
    );
  });

  it('can delete subpopulation not in use', async () => {
    const updateSubpopulations = jest.fn();
    const subpopulations = [specialSubpop, subpopulation];

    const { getByRole } = renderComponent({
      recommendations: [{ text: 'Talk to dr.', subpopulations: [] }], // doesn't use any subpopulation
      subpopulations,
      updateSubpopulations
    });

    await waitFor(() => userEvent.click(getByRole('button', { name: 'delete Subpopulation' }))); // delete button on subpopulation
    await waitFor(() => userEvent.click(getByRole('button', { name: 'Delete' })));

    expect(updateSubpopulations).toHaveBeenCalledWith([specialSubpop], 'subpopulations', true);
  });

  it("can't delete subpopulation or edit its name when used by a recommendation", async () => {
    const updateSubpopulations = jest.fn();
    const subpopulations = [specialSubpop, subpopulation];

    const { getByRole } = renderComponent({
      recommendations: [
        { text: 'Talk to dr.', subpopulations: [{ subpopulationName: 'Subpopulation 1', uniqueId: 'foo123' }] } // uses a subpopulation
      ],
      subpopulations,
      updateSubpopulations
    });

    await waitFor(() => {
      return userEvent.click(getByRole('button', { name: 'delete Subpopulation' }), {
        pointerEventsCheck: PointerEventsCheckLevel.Never
      });
    });

    expect(updateSubpopulations).not.toHaveBeenCalled();

    // Delete button on subpopulation is disabled
    expect(getByRole('button', { name: 'delete Subpopulation' })).toBeDisabled();
    // Title text field on subpopulation is disabled
    expect(getByRole('textbox')).toBeDisabled();
  });
});
