import axios, { AxiosError } from 'axios';
import type { AnyAction, Dispatch } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { RootState } from '../reducers';

import * as types from './types';

const API_BASE = process.env.REACT_APP_API_URL;

// ------------------------- USER ------------------------------------------ //

function requestUser() {
  return {
    type: types.USER_REQUEST
  };
}

function userReceived(username: string | null) {
  return {
    type: types.USER_RECEIVED,
    username
  };
}

function sendUserRequest(): Promise<{ uid: string }> {
  return new Promise((resolve, reject) => {
    axios
      .get<{ uid: string }>(`${API_BASE}/auth/user`, { params: { _: +new Date() } })
      .then(result => resolve(result.data))
      .catch(error => reject(error));
  });
}

export function getCurrentUser(): ThunkAction<Promise<AnyAction>, RootState, never, AnyAction> {
  return (dispatch: ThunkDispatch<RootState, never, AnyAction>) => {
    dispatch(requestUser());

    return sendUserRequest()
      .then(async data => {
        const settingsResult = dispatch(getSettings());
        if (settingsResult && typeof settingsResult.then === 'function') {
          await settingsResult;
        }
        return dispatch(userReceived(data.uid));
      })
      .catch(() => dispatch(userReceived(null)));
  };
}

// ------------------------- LOGIN ----------------------------------------- //

function requestLogin() {
  return {
    type: types.LOGIN_REQUEST
  };
}

function loginSuccess(username: string) {
  return {
    type: types.LOGIN_SUCCESS,
    username
  };
}

function loginFailure(error: AxiosError) {
  return {
    type: types.LOGIN_FAILURE,
    status: error.response?.status ?? 0,
    statusText: error.response?.statusText ?? ''
  };
}

function sendLoginRequest(username: string, password: string): Promise<{ uid: string }> {
  return new Promise((resolve, reject) => {
    axios
      .post<{ uid: string }>(`${API_BASE}/auth/login`, { username, password })
      .then(result => resolve(result.data))
      .catch(error => reject(error));
  });
}

export function loginUser(
  username: string,
  password: string
): ThunkAction<Promise<AnyAction>, RootState, never, AnyAction> {
  return (dispatch: ThunkDispatch<RootState, never, AnyAction>) => {
    dispatch(requestLogin());

    return sendLoginRequest(username, password)
      .then(async data => {
        const settingsResult = dispatch(getSettings());
        if (settingsResult && typeof settingsResult.then === 'function') {
          await settingsResult;
        }
        return dispatch(loginSuccess(data.uid));
      })
      .catch(error => dispatch(loginFailure(error as AxiosError)));
  };
}

// ------------------------- LOGOUT ---------------------------------------- //

function requestLogout() {
  return {
    type: types.LOGOUT_REQUEST
  };
}

function logoutSuccess() {
  return {
    type: types.LOGOUT_SUCCESS
  };
}

function logoutFailure(error: AxiosError) {
  return {
    type: types.LOGOUT_FAILURE,
    status: error.response?.status ?? 0,
    statusText: error.response?.statusText ?? ''
  };
}

export function logoutUser() {
  return (dispatch: Dispatch) => {
    dispatch(requestLogout());
    return axios
      .get(`${API_BASE}/auth/logout`)
      .then(() => dispatch(logoutSuccess()))
      .catch(error => dispatch(logoutFailure(error as AxiosError)));
  };
}

// ------------------------- AUTH STATUS ----------------------------------- //

export function setAuthStatus(status: string | null) {
  return {
    type: types.SET_AUTH_STATUS,
    status
  };
}

// ------------------------- GET SETTINGS ---------------------------------- //

function requestUserSettings() {
  return {
    type: types.USER_SETTINGS_REQUEST
  };
}

function userSettingsSuccess(settings: { termsAcceptedDate?: string | null }) {
  return {
    type: types.USER_SETTINGS_SUCCESS,
    settings
  };
}

function userSettingsFailure(error: AxiosError) {
  return {
    type: types.USER_SETTINGS_FAILURE,
    status: error.response?.status ?? 0,
    statusText: error.response?.statusText ?? ''
  };
}

export function getSettings() {
  return (dispatch: Dispatch) => {
    dispatch(requestUserSettings());
    return axios
      .get<{ termsAcceptedDate?: string | null }>(`${API_BASE}/settings`)
      .then(results => dispatch(userSettingsSuccess(results.data)))
      .catch(error => dispatch(userSettingsFailure(error as AxiosError)));
  };
}

// ------------------------- UPDATE SETTINGS ------------------------------- //

function requestUpdateUserSettings() {
  return {
    type: types.UPDATE_USER_SETTINGS_REQUEST
  };
}

function updateUserSettingsSuccess(settings: { termsAcceptedDate?: string | null }) {
  return {
    type: types.UPDATE_USER_SETTINGS_SUCCESS,
    settings
  };
}

function updateUserSettingsFailure(error: AxiosError) {
  return {
    type: types.UPDATE_USER_SETTINGS_FAILURE,
    status: error.response?.status ?? 0,
    statusText: error.response?.statusText ?? ''
  };
}

export function updateSettings(settings: { termsAcceptedDate?: string | null }) {
  return (dispatch: Dispatch) => {
    dispatch(requestUpdateUserSettings());
    return axios
      .put<{ termsAcceptedDate?: string | null }>(`${API_BASE}/settings`, settings)
      .then(result => dispatch(updateUserSettingsSuccess(result.data)))
      .catch(error => dispatch(updateUserSettingsFailure(error as AxiosError)));
  };
}
