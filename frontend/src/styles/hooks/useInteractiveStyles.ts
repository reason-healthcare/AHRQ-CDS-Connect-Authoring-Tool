import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    pointer: {
      cursor: 'pointer'
    }
  }),
  { name: 'Interactive', index: 1 }
);
