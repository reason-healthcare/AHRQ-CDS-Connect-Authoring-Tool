import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    iconButton: {
      margin: '-20px 0',
      transform: 'scale(0.8)'
    }
  }),
  { name: 'Buttons' }
);
