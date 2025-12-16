import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    tabButtons: {
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }),
  { name: 'Tab', index: 1 }
);
