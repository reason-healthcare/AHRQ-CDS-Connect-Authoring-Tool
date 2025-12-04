import * as types from './types';
import type { Dispatch } from 'redux';

// sets the current tab in the element builder
export function setActiveTab(activeTab: number) {
  return (dispatch: Dispatch) => {
    return dispatch({
      type: types.SET_ACTIVE_TAB,
      activeTab
    });
  };
}

// sets the id to scroll to in the element builder
export function setScrollToId(scrollToId: string | null) {
  return (dispatch: Dispatch) => {
    return dispatch({
      type: types.SET_SCROLL_TO_ID,
      scrollToId
    });
  };
}
