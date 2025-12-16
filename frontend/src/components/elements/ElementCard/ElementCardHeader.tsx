import React from 'react';
import { Alert, Box, Stack } from '@mui/material';

import ElementCardLabel from './ElementCardLabel';
import { StringField, TextAreaField } from 'components/builder/fields';
import { changeToCase } from 'utils/strings';
import type { Alert as AlertType } from 'utils/warnings';
import type { Field } from '../../../types/artifact';
import useStyles from './styles';

interface ElementCardHeaderProps {
  alerts?: AlertType[];
  collapsedContent?: React.ReactElement;
  commentField: Field;
  handleUpdateComment: (field: Field) => void;
  handleUpdateTitleField: (field: Field) => void;
  hasErrors: boolean;
  showComment: boolean;
  showContent: boolean;
  titleField: Field;
  titleFieldIsDisabled: boolean;
  titleLabel: string;
}

const ElementCardHeader: React.FC<ElementCardHeaderProps> = ({
  alerts,
  collapsedContent,
  commentField,
  handleUpdateComment,
  handleUpdateTitleField,
  hasErrors,
  showComment,
  showContent,
  titleField,
  titleFieldIsDisabled,
  titleLabel
}) => {
  const styles = useStyles();
  const label = changeToCase(titleLabel, 'capitalCase');

  return (
    <>
      {showContent ? (
        <>
          <Stack alignItems="center" flexDirection="row">
            <ElementCardLabel label={label} />

            <Box mr={2} width="100%">
              <StringField
                field={titleField}
                handleUpdateField={handleUpdateTitleField}
                isDisabled={titleFieldIsDisabled}
              />
            </Box>
          </Stack>

          {showComment && (
            <Stack alignItems="center" flexDirection="row">
              <ElementCardLabel label="Comment" />

              <Box mr={2} width="100%">
                <TextAreaField field={commentField} handleUpdateField={handleUpdateComment} />
              </Box>
            </Stack>
          )}

          {alerts && (
            <Stack ml="215px" mt={1} mr="15px">
              {alerts.map(
                (alert, index) =>
                  alert.showAlert && (
                    <Alert key={index} severity={alert.alertSeverity}>
                      {alert.alertMessage}
                    </Alert>
                  )
              )}
            </Stack>
          )}
        </>
      ) : (
        <>
          <div className={styles.collapsedContent}>
            <ElementCardLabel label={titleField.value as string} />
            {collapsedContent && collapsedContent}
          </div>

          {hasErrors && (
            <div className={styles.collapsedErrors}>
              <Alert severity="error">Has errors.</Alert>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ElementCardHeader;
