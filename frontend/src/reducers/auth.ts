import * as types from '../actions/types';

export interface AuthState {
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  isLoadingSettings: boolean;
  termsAcceptedDate: string | null;
  username: string | null;
  authStatus: string | null;
  authStatusText: string;
}

interface UserRequestAction {
  type: typeof types.USER_REQUEST;
}

interface UserReceivedAction {
  type: typeof types.USER_RECEIVED;
  username: string | null;
}

interface LoginRequestAction {
  type: typeof types.LOGIN_REQUEST;
}

interface LoginSuccessAction {
  type: typeof types.LOGIN_SUCCESS;
  username: string;
}

interface LoginFailureAction {
  type: typeof types.LOGIN_FAILURE;
  status: number;
  statusText: string;
}

interface LogoutRequestAction {
  type: typeof types.LOGOUT_REQUEST;
}

interface LogoutSuccessAction {
  type: typeof types.LOGOUT_SUCCESS;
}

interface LogoutFailureAction {
  type: typeof types.LOGOUT_FAILURE;
  status: number;
  statusText: string;
}

interface SetAuthStatusAction {
  type: typeof types.SET_AUTH_STATUS;
  status: string | null;
}

interface UserSettingsRequestAction {
  type: typeof types.USER_SETTINGS_REQUEST;
}

interface UserSettingsSuccessAction {
  type: typeof types.USER_SETTINGS_SUCCESS;
  settings: { termsAcceptedDate?: string | null };
}

interface UserSettingsFailureAction {
  type: typeof types.USER_SETTINGS_FAILURE;
  status: number;
  statusText: string;
}

interface UpdateUserSettingsRequestAction {
  type: typeof types.UPDATE_USER_SETTINGS_REQUEST;
}

interface UpdateUserSettingsSuccessAction {
  type: typeof types.UPDATE_USER_SETTINGS_SUCCESS;
  settings: { termsAcceptedDate?: string | null };
}

interface UpdateUserSettingsFailureAction {
  type: typeof types.UPDATE_USER_SETTINGS_FAILURE;
  status: number;
  statusText: string;
}

export type AuthAction =
  | UserRequestAction
  | UserReceivedAction
  | LoginRequestAction
  | LoginSuccessAction
  | LoginFailureAction
  | LogoutRequestAction
  | LogoutSuccessAction
  | LogoutFailureAction
  | SetAuthStatusAction
  | UserSettingsRequestAction
  | UserSettingsSuccessAction
  | UserSettingsFailureAction
  | UpdateUserSettingsRequestAction
  | UpdateUserSettingsSuccessAction
  | UpdateUserSettingsFailureAction;

export const defaultState: AuthState = {
  isAuthenticating: false,
  isAuthenticated: false,
  isLoggingOut: false,
  isLoadingSettings: false,
  termsAcceptedDate: null,
  username: null,
  authStatus: null,
  authStatusText: ''
};

export default function auth(state: AuthState = defaultState, action: AuthAction): AuthState {
  const isAuthenticated = (action as UserReceivedAction | LoginSuccessAction).username != null;

  switch (action.type) {
    case types.USER_REQUEST:
      return {
        ...state,
        isAuthenticating: true
      };
    case types.USER_RECEIVED:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated,
        username: action.username
      };
    case types.LOGIN_REQUEST:
      return {
        ...state,
        isAuthenticating: true,
        authStatus: null
      };
    case types.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: true,
        username: action.username,
        authStatus: 'loginSuccess',
        authStatusText: 'You have been successfully logged in.'
      };
    case types.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: false,
        authStatus: 'loginFailure',
        authStatusText: `Authentication Error: ${action.status} ${action.statusText}, please try again.`
      };
    case types.LOGOUT_REQUEST:
      return {
        ...state,
        isAuthenticating: false,
        isLoggingOut: true,
        authStatus: null
      };
    case types.LOGOUT_SUCCESS:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: false,
        isLoggingOut: false,
        username: null,
        authStatus: 'logoutSuccess',
        authStatusText: 'You have been successfully logged out.'
      };
    case types.LOGOUT_FAILURE:
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: false,
        isLoggingOut: false,
        authStatus: 'logoutFailure',
        authStatusText: `Authentication Error: ${action.status} ${action.statusText}, please try again.`
      };
    case types.SET_AUTH_STATUS:
      return {
        ...state,
        authStatus: action.status
      };
    case types.USER_SETTINGS_REQUEST:
    case types.UPDATE_USER_SETTINGS_REQUEST:
      return {
        ...state,
        isLoadingSettings: true,
        termsAcceptedDate: null
      };
    case types.USER_SETTINGS_FAILURE:
    case types.UPDATE_USER_SETTINGS_FAILURE:
      return {
        ...state,
        isLoadingSettings: false,
        termsAcceptedDate: null
      };
    case types.USER_SETTINGS_SUCCESS:
    case types.UPDATE_USER_SETTINGS_SUCCESS:
      return {
        ...state,
        isLoadingSettings: false,
        termsAcceptedDate: action.settings.termsAcceptedDate ?? null
      };
    default:
      return state;
  }
}
