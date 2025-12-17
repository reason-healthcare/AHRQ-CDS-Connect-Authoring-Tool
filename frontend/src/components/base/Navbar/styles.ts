import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => ({
    tabs: {
      backgroundColor: theme.palette.common.ahrqDarkBlue,
      paddingBottom: '10px !important'
    },
    tab: {
      borderRadius: '5px',
      color: theme.palette.common.white,
      marginRight: '15px',
      minWidth: '160px',
      opacity: 1,
      textTransform: 'none',
      '&:hover, &:focus': {
        color: theme.palette.common.white,
        textDecoration: 'none'
      },
      '&:hover, &.active': {
        backgroundColor: theme.palette.common.ahrqGray
      },
      [theme.breakpoints.down('xl')]: {
        minWidth: '130px'
      },
      [theme.breakpoints.down('lg')]: {
        minWidth: '100px'
      }
    }
  }),
  { name: 'Navbar', index: 1 }
);
