import * as types from '../actions/types';

export interface NavigationState {
  activeTab: number;
  scrollToId: string | null;
}

interface SetActiveTabAction {
  type: typeof types.SET_ACTIVE_TAB;
  activeTab: number;
}

interface SetScrollToIdAction {
  type: typeof types.SET_SCROLL_TO_ID;
  scrollToId: string | null;
}

type NavigationAction = SetActiveTabAction | SetScrollToIdAction;

export const defaultState: NavigationState = {
  activeTab: 0,
  scrollToId: null
};

export default function navigation(state: NavigationState = defaultState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case types.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.activeTab
      };
    case types.SET_SCROLL_TO_ID:
      return {
        ...state,
        scrollToId: action.scrollToId
      };
    default:
      return state;
  }
}
