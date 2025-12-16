import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    libraryCard: {
      alignItems: 'center',
      backgroundColor: theme.palette.common.grayLighter,
      borderRadius: '5px',
      display: 'flex',
      padding: '1em',
      '& svg': {
        marginRight: '10px'
      }
    },
    libraryMetaData: {
      padding: '1em'
    }
  }),
  { name: 'External-Cql', index: 1 }
);
