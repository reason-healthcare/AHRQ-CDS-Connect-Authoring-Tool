import { makeStyles } from '@mui/styles';
import type { Theme } from '@mui/material/styles';

export default makeStyles(
  (theme: Theme) => {
    const common = theme.palette.common;
    return {
      closeButton: {
        float: 'right'
      },
      patientCard: {
        alignItems: 'center',
        backgroundColor: common.grayLighter,
        borderRadius: '5px',
        display: 'flex',
        marginBottom: '20px',
        padding: '20px'
      },
      patientCardDemographics: {
        display: 'flex',
        '& div': {
          color: common.gray,
          fontSize: '0.9em',
          marginRight: '40px'
        }
      },
      patientCardIcon: {
        fontSize: '3em',
        margin: '0 40px 0 20px'
      },
      patientCardName: {
        fontSize: '1.5em'
      },
      patientDataTabList: {
        display: 'flex',
        justifyContent: 'space-between',
        margin: '0rem',
        marginBottom: '1em',
        padding: '0rem',
        top: '0',
        zIndex: '2'
      },
      patientDataTab: {
        alignItems: 'center',
        borderRadius: '0.2em 0.2em 0 0',
        cursor: 'pointer',
        display: 'flex',
        flexGrow: '1',
        justifyContent: 'space-around',
        listStyle: 'none',
        margin: '0 0.25em',
        padding: '0.65em',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        backgroundColor: common.grayLightest,
        '&:first-child': {
          marginLeft: '0em'
        },
        '&:last-child': {
          marginRight: '0em'
        },
        '&:hover': {
          backgroundColor: common.grayLighter
        },
        fontSize: '0.72em',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [theme.breakpoints.down('xxl' as any)]: {
          fontSize: '1em'
        },
        [theme.breakpoints.down('xl')]: {
          fontSize: '0.85em'
        },
        [theme.breakpoints.down('lg')]: {
          fontSize: '0.72em'
        }
      },
      patientDataTabSelected: {
        backgroundColor: common.grayLighter,
        '&:hover': {
          // Don't change the background when selected tab is hovered
          backgroundColor: common.grayLighter
        }
      },
      patientsTableButtons: {
        margin: '2em 0',
        '& button': {
          marginRight: '20px'
        }
      },
      helpLinkRow: {
        display: 'flex'
      },
      helpLink: {
        margin: '2em 0 2em auto'
      },
      testerInstructions: {
        backgroundColor: common.grayLighter,
        borderRadius: '0.2em',
        fontStyle: 'italic',
        marginBottom: '1em',
        padding: '0.75em 1em'
      },
      testResults: {
        backgroundColor: common.grayLighter,
        padding: '2em'
      },
      testResultsSection: {
        '& .Mui-expanded': {
          backgroundColor: common.gray,
          color: common.white
        },
        '& .MuiAccordionSummary-root:hover': {
          backgroundColor: common.gray,
          color: common.white
        },
        '& .MuiAccordionSummary-root:hover .MuiSvgIcon-root': {
          fill: common.white
        }
      },
      testResultsPatientIcon: {
        marginRight: '10px'
      },
      testResultsPatientName: {
        fontWeight: '600'
      },
      testResultsTitle: {
        textAlign: 'center',
        fontSize: '1.2em',
        fontWeight: 'bold',
        marginBottom: '2em'
      },
      testResultsButtonSection: {
        paddingTop: '15px',
        borderTop: `1px solid ${common.grayLighter}`
      },
      trueIcon: {
        fill: common.green
      },
      falseIcon: {
        fill: common.red
      },
      versionButtons: {
        marginTop: '1em',
        '& button': {
          marginRight: '10px'
        }
      }
    };
  },
  { name: 'Testing', index: 1 }
);
