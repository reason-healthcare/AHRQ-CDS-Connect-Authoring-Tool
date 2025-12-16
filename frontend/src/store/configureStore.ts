import { createStore, applyMiddleware, compose } from 'redux';
import type { Store, AnyAction } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import rootReducer from '../reducers';
import type { RootState } from '../reducers';

interface WindowWithReduxDevTools extends Window {
  // eslint-disable-next-line no-underscore-dangle
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
}

export default function configureStore(initialState?: Partial<RootState>): Store<RootState, AnyAction> {
  const middleware = [promiseMiddleware, thunkMiddleware];
  // disable the redux-logger in a production environment
  if (process.env.NODE_ENV === 'development') {
    middleware.push(createLogger());
  }

  const composeEnhancers =
    // eslint-disable-next-line no-underscore-dangle
    ((window as WindowWithReduxDevTools).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ as typeof compose) || compose;
  const store = createStore(
    rootReducer,
    initialState as RootState | undefined,
    composeEnhancers(applyMiddleware(...middleware))
  );

  return store;
}
