import React from 'react';
import { CircularProgress } from '@mui/material';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../store/hooks';

import { ErrorPage } from 'components/base';

interface PrivateRouteProps {
  component: React.ComponentType;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component }) => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const isAuthenticating = useAppSelector(state => state.auth.isAuthenticating);

  if (isAuthenticating) {
    return <CircularProgress />;
  }

  if (!isAuthenticated) {
    return <ErrorPage errorType="notLoggedIn" />;
  }

  return <Component />;
};

export default PrivateRoute;
