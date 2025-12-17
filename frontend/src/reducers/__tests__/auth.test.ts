import * as types from '../../actions/types';
import reducer, { type AuthState, type AuthAction } from '../auth';

interface Action {
  type: string;
  username?: string | null;
  status?: number | string | null; // Can be number for errors, string | null for SET_AUTH_STATUS
  statusText?: string;
  settings?: { termsAcceptedDate?: string | null; [key: string]: unknown };
  [key: string]: unknown;
}

describe('auth reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {} as AuthAction)).toEqual({
      isAuthenticating: false,
      isAuthenticated: false,
      isLoggingOut: false,
      isLoadingSettings: false,
      termsAcceptedDate: null,
      username: null,
      authStatus: null,
      authStatusText: ''
    });
  });

  // ----------------------- USER ------------------------------------------ //
  it('should handle getting the current user', () => {
    let action: Action = { type: types.USER_REQUEST };
    let newState = { isAuthenticating: true };
    expect(reducer({} as AuthState, action as AuthAction)).toEqual(newState);

    const previousState = { isAuthenticating: false } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.USER_RECEIVED, username: 'Test username' };
    newState = { isAuthenticating: false, isAuthenticated: true, username: 'Test username' } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);
  });

  // ----------------------- LOGIN ----------------------------------------- //
  it('should handle logging the user in', () => {
    let action: Action = { type: types.LOGIN_REQUEST };
    let newState = { isAuthenticating: true, authStatus: null } as AuthState;
    expect(reducer({} as AuthState, action as AuthAction)).toEqual(newState);

    const previousState = { isAuthenticating: false, authStatus: 'Test auth status' } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.LOGIN_SUCCESS, username: 'Test username' };
    newState = {
      isAuthenticating: false,
      isAuthenticated: true,
      username: 'Test username',
      authStatus: 'loginSuccess',
      authStatusText: 'You have been successfully logged in.'
    } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.LOGIN_FAILURE, status: 'Test status', statusText: 'Test status text' };
    newState = {
      isAuthenticating: false,
      isAuthenticated: false,
      authStatus: 'loginFailure',
      authStatusText: 'Authentication Error: Test status Test status text, please try again.'
    } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);
  });

  // ------------------------- LOGOUT ---------------------------------------- //
  it('should handle logging the user out', () => {
    let action: Action = { type: types.LOGOUT_REQUEST };
    let newState = { isAuthenticating: false, authStatus: null, isLoggingOut: true } as AuthState;
    expect(reducer({} as AuthState, action as AuthAction)).toEqual(newState);

    const previousState = { isAuthenticating: false, authStatus: 'Test auth status' } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.LOGOUT_SUCCESS };
    newState = {
      isAuthenticating: false,
      isAuthenticated: false,
      isLoggingOut: false,
      username: null,
      authStatus: 'logoutSuccess',
      authStatusText: 'You have been successfully logged out.'
    } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.LOGOUT_FAILURE, status: 'Test status', statusText: 'Test status text' };
    newState = {
      isAuthenticating: false,
      isAuthenticated: false,
      isLoggingOut: false,
      authStatus: 'logoutFailure',
      authStatusText: 'Authentication Error: Test status Test status text, please try again.'
    } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);
  });

  // ------------------------- AUTH STATUS ----------------------------------- //
  it('should handle setting the auth status', () => {
    const action: Action = { type: types.SET_AUTH_STATUS, status: 'Test status' };
    const newState = { authStatus: 'Test status' };
    expect(reducer({} as AuthState, action as AuthAction)).toEqual(newState);

    const previousState = { authStatus: 'Old test status' } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);
  });

  // ------------------------- GET SETTINGS ---------------------------------- //
  it('should handle getting user settings', () => {
    const date = new Date().toString();
    let action: Action = { type: types.USER_SETTINGS_REQUEST };
    let newState = { isLoadingSettings: true, termsAcceptedDate: null } as AuthState;
    expect(reducer({} as AuthState, action as AuthAction)).toEqual(newState);

    const previousState = { isLoadingSettings: false, termsAcceptedDate: date } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.USER_SETTINGS_SUCCESS, settings: { termsAcceptedDate: date } };
    newState = { isLoadingSettings: false, termsAcceptedDate: date } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.USER_SETTINGS_FAILURE, status: 'Test status', statusText: 'Test status text' };
    newState = { isLoadingSettings: false, termsAcceptedDate: null } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);
  });

  // ------------------------- UPDATE SETTINGS ------------------------------- //
  it('should handle updating user settings', () => {
    const date = new Date().toString();
    let action: Action = { type: types.UPDATE_USER_SETTINGS_REQUEST };
    let newState = { isLoadingSettings: true, termsAcceptedDate: null };
    expect(reducer({} as AuthState, action as AuthAction)).toEqual(newState);

    const previousState = { isLoadingSettings: false, termsAcceptedDate: date } as AuthState;
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.UPDATE_USER_SETTINGS_SUCCESS, settings: { termsAcceptedDate: date } };
    newState = { isLoadingSettings: false, termsAcceptedDate: date };
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);

    action = { type: types.UPDATE_USER_SETTINGS_FAILURE, status: 'Test status', statusText: 'Test status text' };
    newState = { isLoadingSettings: false, termsAcceptedDate: null };
    expect(reducer(previousState, action as AuthAction)).toEqual(newState);
  });
});
