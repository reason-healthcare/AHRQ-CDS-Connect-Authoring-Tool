import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createMockStore } from 'redux-test-utils';
import type { Store, AnyAction } from 'redux';
import { reduxState } from 'utils/test_fixtures';
import { render } from 'utils/test-utils';
import Root from '../Root';
import type { RootState } from '../../../reducers';
import type { AuthState } from '../../../reducers/auth';

jest.mock('components/artifact/Artifact', () => () => <div>Artifact Component</div>);
jest.mock('components/base/ErrorPage', () => () => <div>ErrorPage Component</div>);
jest.mock('components/documentation/Documentation', () => () => <div>Documentation Component</div>);
jest.mock('components/landing/Landing', () => () => <div>Landing Component</div>);
jest.mock('components/testing/Tester', () => () => <div>Tester Component</div>);
jest.mock('components/builder/workspace/Workspace', () => () => <div>Workspace Component</div>);

interface RenderComponentProps {
  path?: string;
  store?: RootState;
  [key: string]: unknown;
}

describe('<Root />', () => {
  // Helper to convert ReduxState (from test fixtures) to RootState
  const convertToRootState = (state: typeof reduxState): RootState => {
    return {
      ...state,
      auth: {
        ...state.auth,
        isAuthenticating: false,
        isLoadingSettings: false,
        termsAcceptedDate: null,
        authStatus: null,
        authStatusText: ''
      }
    } as RootState;
  };

  const renderComponent = ({
    path = '/',
    store = convertToRootState(reduxState),
    ...props
  }: RenderComponentProps = {}) =>
    render(<Root store={createMockStore(store) as Store<RootState, AnyAction>} {...props} />, {
      pathname: path
    });

  describe('navigation', () => {
    it('renders the Landing page', () => {
      const { getByText } = renderComponent();

      expect(getByText('Landing Component')).toBeDefined();
    });

    it('renders the Documentation page', () => {
      const { getByText } = renderComponent({ path: '/documentation' });

      expect(getByText('Documentation Component')).toBeDefined();
    });

    it('redirects /userguide to /documentation', () => {
      const { getByText } = renderComponent({ path: '/userguide' });

      expect(getByText('Documentation Component')).toBeDefined();
    });

    it('renders a not found page', () => {
      const { getByText } = renderComponent({ path: '/foo' });

      expect(getByText('ErrorPage Component')).toBeDefined();
    });

    describe('private routes', () => {
      it('renders the not logged in error page when not logged in', () => {
        const { getByText } = renderComponent({
          path: '/build',
          store: {
            ...reduxState,
            auth: {
              ...reduxState.auth,
              isAuthenticated: false,
              isAuthenticating: false,
              isLoggingOut: false,
              isLoadingSettings: false,
              termsAcceptedDate: null,
              username: null,
              authStatus: null,
              authStatusText: ''
            } as AuthState
          } as RootState
        });

        expect(getByText('ErrorPage Component')).toBeDefined();
      });

      it('renders the Workspace index page', () => {
        const { getByText } = renderComponent({ path: '/build' });

        expect(getByText('Workspace Component')).toBeDefined();
      });

      it('renders the Workspace show page', () => {
        const { getByText } = renderComponent({ path: '/build/123' });

        expect(getByText('Workspace Component')).toBeDefined();
      });

      it('renders the Testing page', () => {
        const { getByText } = renderComponent({ path: '/testing' });

        expect(getByText('Tester Component')).toBeDefined();
      });

      it('renders the Artifact page', () => {
        const { getByText } = renderComponent({ path: '/artifacts' });

        expect(getByText('Artifact Component')).toBeDefined();
      });
    });
  });
});
