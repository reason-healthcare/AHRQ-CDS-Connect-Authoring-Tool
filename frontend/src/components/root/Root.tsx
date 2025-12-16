import React from 'react';
import { Provider } from 'react-redux';
import { Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import type { Store, AnyAction } from 'redux';

import App from './App';
import { Artifact } from 'components/artifact';
import { Tester } from 'components/testing';
import { Workspace } from 'components/builder/workspace';
import { Documentation } from 'components/documentation';
import { ErrorPage } from 'components/base';
import { Landing } from 'components/landing';
import { PrivateRoute } from 'components/auth';
import lightTheme from 'styles/theme';
import type { RootState } from '../../reducers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
});

interface RootProps {
  store: Store<RootState, AnyAction>;
}

const Root: React.FC<RootProps> = ({ store }) => (
  <Provider store={store}>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={lightTheme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <QueryClientProvider client={queryClient}>
            <HelmetProvider>
              <App>
                <Routes>
                  <Route path="" element={<Landing />} />
                  <Route path="build/:id" element={<PrivateRoute component={Workspace} />} />
                  <Route path="build" element={<PrivateRoute component={Workspace} />} />
                  <Route path="artifacts" element={<PrivateRoute component={Artifact} />} />
                  <Route path="testing" element={<PrivateRoute component={Tester} />} />
                  <Route path="documentation/tutorial" element={<Documentation activeTab={1} />} />
                  <Route path="documentation/datatypes" element={<Documentation activeTab={2} />} />
                  <Route path="documentation/terms" element={<Documentation activeTab={3} />} />
                  <Route path="documentation" element={<Documentation />} />
                  <Route path="userguide" element={<Navigate to="/documentation" replace />} />
                  <Route path="*" element={<ErrorPage errorType="notFound" />} />
                </Routes>
              </App>
            </HelmetProvider>
          </QueryClientProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </Provider>
);

export default Root;
