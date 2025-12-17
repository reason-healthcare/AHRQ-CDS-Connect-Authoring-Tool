import React from 'react';
import { Provider } from 'react-redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createMockStore as reduxCreateMockStore } from 'redux-test-utils';
import type { Store } from 'redux';
import { reduxState } from 'utils/test_fixtures';
import { screen, render } from 'utils/test-utils';
import Logout from '../Logout';

interface RootState {
  [key: string]: unknown;
}

const defaultState: RootState = {
  ...reduxState,
  auth: {
    ...reduxState.auth,
    termsAcceptedDate: null
  }
};

const createMockStore = (state: RootState): Store => {
  const store = reduxCreateMockStore(state) as Store;
  const originalDispatch = store.dispatch;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrappedDispatch = (...args: any[]): Promise<unknown> => {
    originalDispatch(...(args as [any]));
    return Promise.resolve({});
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (store as any).dispatch = wrappedDispatch;

  return store;
};

interface RenderComponentProps {
  store?: Store;
  [key: string]: unknown;
}

const renderComponent = ({ store = createMockStore(defaultState), ...props }: RenderComponentProps = {}) =>
  render(
    <Provider store={store}>
      <Logout />
    </Provider>
  );

describe('<Logout />', () => {
  it('should render terms and conditions modal if termsAcceptedDate is null', () => {
    const store = createMockStore(defaultState);
    renderComponent({ store });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('should not render terms and conditions if termsAcceptedDate is not null', () => {
    const store = createMockStore({
      ...defaultState,
      auth: { ...(defaultState.auth as Record<string, unknown>), termsAcceptedDate: new Date().toString() }
    });
    renderComponent({ store });

    const dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });
});
