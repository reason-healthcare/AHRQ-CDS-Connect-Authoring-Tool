import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => {
    const common = theme.palette.common;
    return {
      alert: {
        margin: '20px 0'
      },
      content: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '300px'
      },
      header: {
        borderBottom: `1px solid ${common.grayLighter}`,
        padding: '0 1em 10px 1em',
        margin: 0
      },
      headerIndicator: {
        borderLeft: `3px solid ${common.blue}`,
        padding: '0 20px',
        margin: '10px 0'
      },
      headerIndicatorHighlight: {
        borderColor: common.blueHighlight
      },
      headerIndicatorLabel: {
        fontWeight: 'bold',
        marginRight: '10px'
      },
      headerTag: {
        alignItems: 'center',
        display: 'flex',
        fontSize: '0.95em'
      },
      list: {
        backgroundColor: common.blueDarker,
        fontSize: '0.8em',
        margin: '10px 0 20px 0',
        padding: '20px'
      },
      listItem: {
        '& a': {
          fontStyle: 'italic',
          marginLeft: '10px'
        }
      },
      iconButton: {
        height: '50px',
        width: '50px'
      },
      form: {
        alignItems: 'center',
        display: 'flex',
        flex: '1'
      },
      formInput: {
        flex: '1',
        marginRight: '10px'
      },
      searchContainer: {
        backgroundColor: common.grayLightest,
        borderBottom: `0.1em solid ${common.grayLighter}`,
        display: 'flex',
        padding: '1em 2em'
      }
    };
  },
  { name: 'Builder-Modals', index: 1 }
);
