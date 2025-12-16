import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    action: {
      marginBottom: '1em',
      padding: '1em',
      background: theme.palette.common.white,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    actionTitle: {
      fontWeight: 'bold'
    }
  }),
  { name: 'Suggestions', index: 1 }
);
