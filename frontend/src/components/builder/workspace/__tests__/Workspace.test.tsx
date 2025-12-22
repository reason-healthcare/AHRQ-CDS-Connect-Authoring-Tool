import React from 'react';
import { Provider } from 'react-redux';
import type { Store, AnyAction, Dispatch } from 'redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createMockStore as reduxCreateMockStore } from 'redux-test-utils';
import _ from 'lodash';
// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import * as types from 'actions/types';
import mockModifiers from 'mocks/modifiers/mockModifiers';
import { render, fireEvent, userEvent, screen, waitFor, within } from 'utils/test-utils';
import { instanceTree, artifact, reduxState } from 'utils/test_fixtures';
import { simpleObservationInstanceTree } from 'utils/test_fixtures';
import { simpleConditionInstanceTree } from 'utils/test_fixtures';
import { simpleProcedureInstanceTree } from 'utils/test_fixtures';
import { simpleImmunizationInstanceTree } from 'utils/test_fixtures';
import { getFieldWithId } from 'utils/instances';
import Workspace from '../Workspace';
import { mockArtifact } from 'mocks/artifacts';
import { mockExternalCqlLibrary } from 'mocks/external-cql';
import { mockTemplates } from 'mocks/templates';
import { ArtifactState } from 'reducers/artifacts';

interface ModifiersByInputType {
  [key: string]: unknown[];
}

const modifiersByInputType: ModifiersByInputType = {};

(mockModifiers as Array<{ inputTypes?: string[]; [key: string]: unknown }>).forEach(modifier => {
  if (modifier.inputTypes) {
    modifier.inputTypes.forEach(inputType => {
      modifiersByInputType[inputType] = (modifiersByInputType[inputType] || []).concat(modifier);
    });
  }
});

const defaultState = {
  ...reduxState,
  artifacts: {
    ...((reduxState as { artifacts?: ArtifactState }).artifacts || {}),
    artifact: {
      ...artifact,
      expTreeInclude: instanceTree
    }
  },
  modifiers: {
    ...((reduxState as { modifiers?: ModifiersByInputType }).modifiers || {})
  },
  navigation: {
    activeTab: 1,
    scrollToId: null
  }
};

const getDefaultStateWithInstanceTree = (instanceTree: unknown) => {
  return {
    ...reduxState,
    artifacts: {
      ...((reduxState as { artifacts?: ArtifactState }).artifacts || {}),
      artifact: {
        ...artifact,
        expTreeInclude: instanceTree
      }
    },
    modifiers: {
      ...((reduxState as { modifiers?: ModifiersByInputType }).modifiers || {})
    },
    navigation: {
      activeTab: 1,
      scrollToId: null
    }
  };
};

interface MockStore extends Store<unknown, AnyAction> {
  dispatch: Dispatch<AnyAction>;
  getActions: () => unknown[];
}

const createMockStore = (state: unknown): MockStore => {
  // redux-test-utils' createMockStore returns a store-like object with getActions
  const mockStore = reduxCreateMockStore(state) as MockStore;
  return mockStore;
};

const expandAction = (action: unknown): unknown => {
  if (typeof action !== 'function') return action;
  let args: unknown;
  (action as (callback: (args: unknown) => void) => void)(actionArgs => (args = actionArgs));
  return args;
};

interface RenderComponentProps {
  store?: MockStore;
  [key: string]: unknown;
}

describe('<Workspace />', () => {
  const renderComponent = ({ store = createMockStore(defaultState), ...props }: RenderComponentProps = {}) =>
    render(
      <Provider store={store}>
        <Workspace />
      </Provider>
    );

  beforeEach(() => {
    nock('http://localhost')
      .persist()
      .put('/authoring/api/artifacts') // mock any put request so can make updates to artifact in tests
      .reply(200, 'OK')
      .get('/authoring/api/artifacts/artifact123')
      .reply(200, [{ ...artifact, expTreeInclude: instanceTree }])
      .get('/authoring/api/config/valuesets/demographics/units_of_time')
      .reply(200, { expansion: [] })
      .get(`/authoring/api/externalCQL/${(mockArtifact as { _id?: string })._id}`)
      .reply(200, [mockExternalCqlLibrary])
      .get(`/authoring/api/modifiers/${(mockArtifact as { _id?: string })._id}`)
      .reply(200, mockModifiers)
      .get('/authoring/api/config/templates')
      .reply(200, mockTemplates);
  });
  afterEach(() => nock.cleanAll());

  afterAll(() => nock.restore());

  it('can edit a template instance', async () => {
    const store = createMockStore(defaultState);
    const { unmount } = renderComponent({ store });

    await waitFor(() => {
      return fireEvent.click(screen.getByLabelText('Age Range'));
    });

    await waitFor(() => {
      return fireEvent.change(document.querySelector('input[type=text]') as HTMLInputElement, {
        target: { value: '30 to 45' }
      });
    });

    const updateAction = expandAction(_.last(store.getActions())) as {
      type?: string;
      artifact?: { expTreeInclude?: { childInstances?: Array<{ fields?: unknown[] }> } };
    };
    const nameField = getFieldWithId(
      (updateAction.artifact?.expTreeInclude?.childInstances?.[0]?.fields as Array<{ id?: string; value?: unknown }>) ||
        [],
      'element_name'
    );

    expect(updateAction.type).toEqual(types.UPDATE_ARTIFACT);
    expect((nameField as { value?: string })?.value).toEqual('30 to 45');

    unmount();
  });

  it('can edit a conjunction instance', async () => {
    const store = createMockStore(defaultState);
    const { unmount } = renderComponent({ store });

    await waitFor(() => {
      return userEvent.click(screen.getAllByRole('combobox', { name: '' })[0]);
    });
    await waitFor(() => userEvent.click(screen.getByText('Or')));

    const updateAction = expandAction(_.last(store.getActions())) as {
      type?: string;
      artifact?: { expTreeInclude?: { id?: string; name?: string } };
    };
    const instance = updateAction.artifact?.expTreeInclude;

    expect(updateAction.type).toEqual(types.UPDATE_ARTIFACT);
    expect(instance?.id).toEqual('Or');
    expect(instance?.name).toEqual('Or');
    unmount();
  });

  it('can delete an instance', async () => {
    const store = createMockStore({
      ...defaultState,
      artifacts: {
        ...(defaultState.artifacts || {}),
        artifact: {
          ...artifact,
          expTreeInclude: {
            ...(instanceTree as { childInstances?: unknown[] }),
            childInstances: (instanceTree as { childInstances?: unknown[] }).childInstances?.slice(0, 1)
          }
        }
      }
    });

    const { unmount } = renderComponent({ store });

    await waitFor(() => {
      return fireEvent.click(screen.getByLabelText('delete Age Range'));
    });
    fireEvent.click(screen.getByText('Delete'));

    const updateAction = expandAction(_.last(store.getActions())) as {
      type?: string;
      artifact?: { expTreeInclude?: { childInstances?: unknown[] } };
    };

    expect(updateAction.type).toEqual(types.UPDATE_ARTIFACT);
    expect(updateAction.artifact?.expTreeInclude?.childInstances).toHaveLength(0);
    unmount();
  });

  describe('Test that certain modifiers appear given current return type of list_of_observations', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/authoring/api/config/valuesets/demographics/units_of_time')
        .reply(200, { expansion: [] });
    });

    describe('Test FirstObservation modifier.', () => {
      const store = createMockStore(getDefaultStateWithInstanceTree(simpleObservationInstanceTree));

      it('should render as a modifier option within a button and dispatch UPDATE_ARTIFACT when added', async () => {
        const { unmount } = renderComponent({ store });

        await waitFor(() => userEvent.click(screen.getAllByRole('button', { name: /Add Modifiers/i })[0]));
        const modal = within(await screen.findByRole('dialog'));
        await waitFor(() => userEvent.click(modal.getAllByRole('button', { name: 'Select Modifiers' })[0]));
        await waitFor(() => userEvent.click(modal.getByLabelText('Select modifier...')));
        await waitFor(() => userEvent.click(within(screen.queryByRole('listbox') as HTMLElement).getByText('First')));
        await waitFor(() => userEvent.click(modal.getByRole('button', { name: 'Add' })));

        const updateAction = expandAction(_.last(store.getActions())) as {
          type?: string;
          artifact?: {
            expTreeInclude?: {
              childInstances?: Array<{
                modifiers?: Array<{ id?: string; name?: string }>;
              }>;
            };
          };
        };
        const [instance] = updateAction.artifact?.expTreeInclude?.childInstances;
        const [modifier] = instance?.modifiers;

        expect(updateAction).toBeDefined();
        expect(updateAction.type).toEqual(types.UPDATE_ARTIFACT);
        expect(modifier?.id).toEqual('FirstObservation');
        expect(modifier?.name).toEqual('First');
        unmount();
      });
    });

    describe('Test AverageObservationValue modifier.', () => {
      const store = createMockStore(getDefaultStateWithInstanceTree(simpleObservationInstanceTree));

      it('should render as a modifier option within a button and dispatch UPDATE_ARTIFACT when added', async () => {
        const { unmount } = renderComponent({ store });

        await waitFor(() => userEvent.click(screen.getAllByRole('button', { name: /Add Modifiers/i })[0]));
        const modal = within(await screen.findByRole('dialog'));
        await waitFor(() => userEvent.click(modal.getAllByRole('button', { name: 'Select Modifiers' })[0]));
        await waitFor(() => userEvent.click(modal.getByLabelText('Select modifier...')));
        await waitFor(() =>
          userEvent.click(within(screen.queryByRole('listbox') as HTMLElement).getByText('Average Observation Value'))
        );
        await waitFor(() => userEvent.click(modal.getByRole('button', { name: 'Add' })));

        const updateAction = expandAction(_.last(store.getActions())) as {
          type?: string;
          artifact?: {
            expTreeInclude?: {
              childInstances?: Array<{
                modifiers?: Array<{ id?: string; name?: string }>;
              }>;
            };
          };
        };
        const [instance] = updateAction.artifact?.expTreeInclude?.childInstances;
        const [modifier] = instance?.modifiers;

        expect(updateAction).toBeDefined();
        expect(updateAction.type).toEqual(types.UPDATE_ARTIFACT);
        expect(modifier?.id).toEqual('AverageObservationValue');
        expect(modifier?.name).toEqual('Average Observation Value');
        unmount();
      });
    });

    describe('Test FirstCondition Modifier.', () => {
      const store = createMockStore(getDefaultStateWithInstanceTree(simpleConditionInstanceTree));

      it('should render as a modifier option within a button and dispatch UPDATE_ARTIFACT when added', async () => {
        const { unmount } = renderComponent({ store });

        await waitFor(() => userEvent.click(screen.getAllByRole('button', { name: /Add Modifiers/i })[0]));
        const modal = within(await screen.findByRole('dialog'));
        await waitFor(() => userEvent.click(modal.getAllByRole('button', { name: 'Select Modifiers' })[0]));
        await waitFor(() => userEvent.click(modal.getByLabelText('Select modifier...')));
        await waitFor(() => userEvent.click(within(screen.queryByRole('listbox') as HTMLElement).getByText('First')));
        await waitFor(() => userEvent.click(modal.getByRole('button', { name: 'Add' })));

        const updateAction = expandAction(_.last(store.getActions())) as {
          type?: string;
          artifact?: {
            expTreeInclude?: {
              childInstances?: Array<{
                modifiers?: Array<{ id?: string; name?: string }>;
              }>;
            };
          };
        };
        const [instance] = updateAction.artifact?.expTreeInclude?.childInstances || [];
        const [modifier] = instance?.modifiers;

        expect(updateAction).toBeDefined();
        expect(updateAction.type).toEqual(types.UPDATE_ARTIFACT);
        expect(modifier?.id).toEqual('FirstCondition');
        expect(modifier?.name).toEqual('First');
        unmount();
      });
    });

    describe('Test FirstProcedure Modifier.', () => {
      const store = createMockStore(getDefaultStateWithInstanceTree(simpleProcedureInstanceTree));

      it('should render as a modifier option within a button and dispatch UPDATE_ARTIFACT when added', async () => {
        const { unmount } = renderComponent({ store });

        await waitFor(() => userEvent.click(screen.getAllByRole('button', { name: /Add Modifiers/i })[0]), {
          timeout: 15000
        });
        const modal = within(await screen.findByRole('dialog'));
        await waitFor(() => userEvent.click(modal.getAllByRole('button', { name: 'Select Modifiers' })[0]));
        await waitFor(() => userEvent.click(modal.getByLabelText('Select modifier...')));
        await waitFor(() => userEvent.click(within(screen.queryByRole('listbox') as HTMLElement).getByText('First')));
        await waitFor(() => userEvent.click(modal.getByRole('button', { name: 'Add' })));

        const updateAction = expandAction(_.last(store.getActions())) as {
          type?: string;
          artifact?: {
            expTreeInclude?: {
              childInstances?: Array<{
                modifiers?: Array<{ id?: string; name?: string }>;
              }>;
            };
          };
        };
        const [instance] = updateAction.artifact?.expTreeInclude?.childInstances || [];
        const [modifier] = instance?.modifiers;

        expect(updateAction).toBeDefined();
        expect(updateAction.type).toEqual(types.UPDATE_ARTIFACT);
        expect(modifier?.id).toEqual('FirstProcedure');
        expect(modifier?.name).toEqual('First');
        unmount();
      });
    });

    describe('Test FirstImmunization Modifier.', () => {
      const store = createMockStore(getDefaultStateWithInstanceTree(simpleImmunizationInstanceTree));

      it('should render as a modifier option within a button and dispatch UPDATE_ARTIFACT when added', async () => {
        const { unmount } = renderComponent({ store });

        await waitFor(() => userEvent.click(screen.getAllByRole('button', { name: /Add Modifiers/i })[0]));
        const modal = within(await screen.findByRole('dialog'));
        await waitFor(() => userEvent.click(modal.getAllByRole('button', { name: 'Select Modifiers' })[0]));
        await waitFor(() => userEvent.click(modal.getByLabelText('Select modifier...')));
        await waitFor(() => userEvent.click(within(screen.queryByRole('listbox') as HTMLElement).getByText('First')));
        await waitFor(() => userEvent.click(modal.getByRole('button', { name: 'Add' })));

        const updateAction = expandAction(_.last(store.getActions())) as {
          type?: string;
          artifact?: {
            expTreeInclude?: {
              childInstances?: Array<{
                modifiers?: Array<{ id?: string; name?: string }>;
              }>;
            };
          };
        };
        const [instance] = updateAction.artifact?.expTreeInclude?.childInstances || [];
        const [modifier] = instance?.modifiers;

        expect(updateAction).toBeDefined();
        expect(updateAction.type).toEqual(types.UPDATE_ARTIFACT);
        expect(modifier?.id).toEqual('FirstImmunization');
        expect(modifier?.name).toEqual('First');
        unmount();
      });
    });
  });
});
