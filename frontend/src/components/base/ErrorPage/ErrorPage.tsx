import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSpacingStyles } from 'styles/hooks';
import useStyles from './styles';

interface ErrorPageProps {
  errorType?: 'notLoggedIn' | 'notFound' | string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ errorType }) => {
  const styles = useStyles();
  const spacingStyles = useSpacingStyles();
  const { pathname } = useLocation();

  const getErrorMessage = (): React.ReactNode => {
    switch (errorType) {
      case 'notLoggedIn':
        return (
          <>
            Unable to reach <code>{pathname}</code>. You may need to log in to access.
          </>
        );
      case 'notFound':
        return (
          <>
            No match for <code>{pathname}</code>.
          </>
        );
      default:
        return 'An error has occurred.';
    }
  };

  return (
    <div className={styles.root} id="maincontent">
      <div className={spacingStyles.globalPadding}>
        <h3>{getErrorMessage()}</h3>
      </div>
    </div>
  );
};

export default ErrorPage;
