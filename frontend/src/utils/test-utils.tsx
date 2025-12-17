import React from 'react';
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

import lightTheme from '../styles/theme';
import configureStore from '../store/configureStore';

const ProviderWrapper = ({ children, pathname }: { children: React.ReactNode; pathname?: string }) => (
  <MemoryRouter initialEntries={pathname ? [pathname] : undefined}>
    <Provider store={configureStore()}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <QueryClientProvider client={new QueryClient()}>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={lightTheme}>
              <HelmetProvider>{children}</HelmetProvider>
            </ThemeProvider>
          </StyledEngineProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </Provider>
  </MemoryRouter>
);

export const render = (ui: React.ReactElement, options = {}) => {
  const { pathname, ...restOptions } = options as { pathname?: string } & RenderOptions;
  return testingLibRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ProviderWrapper pathname={pathname}>{children}</ProviderWrapper>
    ),
    ...restOptions
  });
};

export const changeDate = async (value, index = 0) => {
  await act(async () => {
    fireEvent.change(screen.getAllByPlaceholderText(/mm\/dd\/yyyy/i)[index], { target: { value } });
  });
};

export const changeTime = async (value, index = 0) => {
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
