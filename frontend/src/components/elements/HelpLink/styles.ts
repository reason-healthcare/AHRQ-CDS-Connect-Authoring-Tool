import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    helpButton: {
      color: theme.palette.common.blueHighlight,
      fontSize: '16px',
      fontWeight: '600',
      '& svg': {
        fontSize: '18px',
        marginRight: '3px'
      }
    },
    helpLink: {
      color: theme.palette.common.blueHighlight,
      '& svg': {
        fontSize: '18px'
      }
    }
  }),
  { name: 'HelpLink', index: 1 }
);
