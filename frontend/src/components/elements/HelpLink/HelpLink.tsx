import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, IconButton } from '@mui/material';
import { Help as HelpIcon } from '@mui/icons-material';

import { Tooltip } from 'components/elements';
import useStyles from './styles';

interface HelpLinkProps {
  linkPath: string;
  showText?: boolean;
  tooltipTitle?: string;
}

const HelpLink: React.FC<HelpLinkProps> = ({ linkPath, showText, tooltipTitle = 'View Documentation' }) => {
  const styles = useStyles();

  return (
    <>
      {showText ? (
        <Button
          className={styles.helpButton}
          color="primary"
          component={RouterLink}
          rel="noopener noreferrer"
          target="_blank"
          to={`/${linkPath}`}
        >
          <HelpIcon /> HELP
        </Button>
      ) : (
        <Tooltip title={tooltipTitle}>
          <IconButton
            aria-label="help"
            className={styles.helpLink}
            href={`${process.env.PUBLIC_URL}/${linkPath}`}
            rel="noopener noreferrer"
            size="small"
            target="_blank"
          >
            <HelpIcon />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default HelpLink;
