// eslint-disable-next-line import/no-extraneous-dependencies
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../vsac';
import * as types from '../types';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

interface RootState {
  [key: string]: unknown;
}

describe('vsac actions', () => {
  it('dispatches a SET_VSAC_API_KEY action', () => {
    const store = mockStore({} as RootState);

    store.dispatch(actions.setVSACApiKey('key'));
    expect(store.getActions()).toEqual([{ type: types.SET_VSAC_API_KEY, apiKey: 'key' }]);
  });
});
