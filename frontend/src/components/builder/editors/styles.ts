import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    editorLabel: {
      fontWeight: 'bold',
      margin: '0',
      marginRight: '12px',
      whitespace: 'nowrap'
    },
    editorDisplay: {
      backgroundColor: theme.palette.common.white,
      borderRadius: '5px',
      marginRight: '10px',
      padding: '10px',
      width: '90%'
    },
    editorDisplayGroup: {
      alignItems: 'center',
      display: 'flex'
    }
  }),
  { name: 'Editors', index: 1 }
);
