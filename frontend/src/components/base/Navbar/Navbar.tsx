import React, { forwardRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Tab, Tabs, type TabProps } from '@mui/material';
import clsx from 'clsx';

import { onVisitExternalForm } from 'utils/handlers';
import { useAccessibilityStyles, useSpacingStyles } from 'styles/hooks';
import useStyles from './styles';

interface NavbarProps {
  isAuthenticated: boolean;
}

const a11yProps = (index: number): { id: string; 'aria-controls': string } => ({
  id: `tab-${index}`,
  'aria-controls': `tabpanel-${index}`
});

const tabNavigationValue = ({
  pathname,
  isAuthenticated
}: {
  pathname: string;
  isAuthenticated: boolean;
}): string | false => {
  switch (pathname) {
    case '/':
      return pathname;
    case '/documentation':
    case '/documentation/userguide':
    case '/documentation/tutorial':
    case '/documentation/datatypes':
    case '/documentation/terms':
      return '/documentation';
    case '/artifacts':
    case '/build':
    case '/testing':
      return isAuthenticated ? pathname : false;
    default:
      return false;
  }
};

interface NavtabProps extends TabProps {
  index: number;
  isExternal?: boolean;
  value: string;
}

const Navtab = forwardRef<HTMLDivElement, NavtabProps>(({ index, isExternal = false, ...props }, ref) => {
  const styles = useStyles();
  const linkProps: { href?: string; to?: string } = {
    [isExternal ? 'href' : 'to']: props.value
  };

  return (
    <Tab
      ref={ref}
      className={styles.tab}
      component={isExternal ? 'a' : NavLink}
      onClick={isExternal ? e => onVisitExternalForm(e as React.MouseEvent<HTMLAnchorElement>) : undefined}
      {...a11yProps(index)}
      {...props}
      {...linkProps}
    />
  );
});

Navtab.displayName = 'Navtab';

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated }) => {
  const styles = useStyles();
  const spacingStyles = useSpacingStyles();
  const accessibilityStyles = useAccessibilityStyles();
  const { pathname } = useLocation();

  return (
    <div className={spacingStyles.globalPadding}>
      <div className={accessibilityStyles.srOnly} id="cds-main-navigation">
        Main navigation
      </div>

      <Tabs
        className={clsx(styles.tabs, spacingStyles.fullBleed)}
        TabIndicatorProps={{ style: { display: 'none' } }}
        textColor="inherit"
        value={tabNavigationValue({ pathname, isAuthenticated })}
      >
        <Navtab label="Home" index={0} value="/" />

        {isAuthenticated && [
          <Navtab key={1} label="Artifacts" index={1} value="/artifacts" />,
          <Navtab key={2} label="Workspace" index={2} value="/build" />,
          <Navtab key={3} label="Testing" index={3} value="/testing" />
        ]}

        <Navtab label="Documentation" index={4} value="/documentation" />

        {/* {!isAuthenticated && (
          <Navtab label="Sign Up" index={5} value="https://cds.ahrq.gov/form/cds-authoring-tool-sign-up" isExternal />
        )} */}

        <Navtab label="Contact Us" index={6} value="https://github.com/preston/cds-connect-authoring-tool" isExternal />
      </Tabs>
    </div>
  );
};

export default Navbar;
