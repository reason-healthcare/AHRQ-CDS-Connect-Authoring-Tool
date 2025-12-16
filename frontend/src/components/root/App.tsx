import React, { useEffect } from 'react';
import type { ReactNode } from 'react';

// eslint-disable-next-line import/no-unresolved
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import { getCurrentUser } from 'actions/auth';

import { Analytics, Navbar } from 'components/base';
import CdsHeader from 'components/header/CdsHeader';

interface AppProps {
  children: ReactNode;
}

const App: React.FC<AppProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return (
    <div className="app">
      <a className="skiplink" href="#maincontent">
        Skip to main content
      </a>
      <Analytics gtmKey={process.env.REACT_APP_GTM_KEY} dapURL={process.env.REACT_APP_DAP_URL} />
      {/* <AhrqHeader /> */}
      <CdsHeader />
      <Navbar isAuthenticated={isAuthenticated} />
      {children}
      {/* <CdsFooter /> */}
      {/* <AhrqFooter /> */}
    </div>
  );
};

export default App;
