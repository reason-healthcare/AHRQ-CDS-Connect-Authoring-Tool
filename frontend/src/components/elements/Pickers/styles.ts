import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    picker: {
      '& button': {
        padding: '20px 5px'
      }
    }
  }),
  { name: 'Pickers', index: 1 }
);
