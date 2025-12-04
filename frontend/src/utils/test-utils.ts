import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import { render as testingLibRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { HelmetProvider } from 'react-helmet-async';
// eslint-disable-next-line import/no-extraneous-dependencies
import { act, screen, fireEvent } from '@testing-library/react';

import configureStore from '../store/configureStore';
import lightTheme from 'styles/theme';

interface ProviderWrapperProps {
  children: React.ReactNode;
  pathname?: string;
}

const ProviderWrapper = ({ children, pathname }: ProviderWrapperProps): ReactElement => {
  const store = configureStore();
  const queryClient = new QueryClient();
  const localizationProvider = React.createElement(
    LocalizationProvider,
    { dateAdapter: AdapterDateFns },
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        StyledEngineProvider,
        { injectFirst: true },
        React.createElement(ThemeProvider, { theme: lightTheme }, React.createElement(HelmetProvider, null, children))
      )
    )
  );
  const provider = React.createElement(Provider, { store, children: localizationProvider });
  return React.createElement(MemoryRouter, { initialEntries: pathname ? [pathname] : undefined }, provider);
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  pathname?: string;
}

export const render = (ui: ReactElement, options: CustomRenderOptions = {}): ReturnType<typeof testingLibRender> => {
  const { pathname, ...restOptions } = options;
  return testingLibRender(ui, {
    wrapper: (props: { children: React.ReactNode }) => React.createElement(ProviderWrapper, { ...props, pathname }),
    ...restOptions
  });
};

export const changeDate = async (value: string, index = 0): Promise<void> => {
  await act(async () => {
    fireEvent.change(screen.getAllByPlaceholderText(/mm\/dd\/yyyy/i)[index], { target: { value } });
  });
};

export const changeTime = async (value: string, index = 0): Promise<void> => {
  await act(async () => {
    fireEvent.change(screen.getAllByPlaceholderText(/hh:mm:ss/i)[index], { target: { value } });
  });
};

// eslint-disable-next-line import/no-extraneous-dependencies
export { getRoles, logRoles } from '@testing-library/dom';
// eslint-disable-next-line import/no-extraneous-dependencies
export { act, fireEvent, waitFor, waitForElementToBeRemoved, prettyDOM, screen, within } from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
export { default as userEvent, PointerEventsCheckLevel } from '@testing-library/user-event';
