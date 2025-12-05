import React, { KeyboardEvent } from 'react';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { lightTheme, darkTheme } from 'styles/theme';
import useStyles from './styles';

interface ModalProps {
  children: React.ReactElement;
  closeButtonText?: string;
  disableBackdropClick?: boolean;
  Footer?: React.ReactElement | boolean;
  handleCloseModal: () => void;
  handleSaveModal: () => void;
  isOpen: boolean;
  hasCancelButton?: boolean;
  hasEnterKeySubmit?: boolean;
  hasTitleIcon?: boolean;
  Header?: React.ReactElement;
  hideSubmitButton?: boolean;
  isLoading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  submitButtonText?: string;
  submitDisabled?: boolean;
  theme?: 'light' | 'dark';
  title: string;
  TitleIcon?: React.ReactElement;
}

const Modal: React.FC<ModalProps> = ({
  children,
  closeButtonText = 'Cancel',
  disableBackdropClick = false,
  Footer,
  handleCloseModal,
  handleSaveModal,
  isOpen,
  hasCancelButton = false,
  hasEnterKeySubmit = true,
  hasTitleIcon = false,
  Header,
  hideSubmitButton = false,
  isLoading = false,
  maxWidth = 'lg',
  submitButtonText = 'Save',
  submitDisabled = false,
  theme = 'light',
  title,
  TitleIcon
}) => {
  const styles = useStyles();
  const modalTheme = theme === 'dark' ? darkTheme : lightTheme;

  const enterKeyCheck = (func: () => void, argument: unknown, event: KeyboardEvent<HTMLDivElement> | null): void => {
    if (!event || event.type !== 'keydown' || event.key !== 'Enter') return;
    event.preventDefault();
    if (argument) {
      func();
    } else {
      func();
    }
  };

  const onClose = (event: object, reason?: string): void => {
    if (reason && reason === 'backdropClick' && disableBackdropClick) {
      return;
    }
    handleCloseModal();
  };

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={modalTheme}>
        <Dialog
          fullWidth
          maxWidth={maxWidth}
          onClose={onClose}
          onKeyDown={
            hasEnterKeySubmit
              ? (e: KeyboardEvent<HTMLDivElement>) => enterKeyCheck(handleSaveModal, null, e)
              : undefined
          }
          open={isOpen}
        >
          <DialogTitle>
            <Typography variant="body1" data-testid={title}>
              {title}
            </Typography>

            <div>
              <div className={styles.titleIcon}>{hasTitleIcon && TitleIcon}</div>

              <IconButton aria-label="close" className={styles.closeButton} onClick={handleCloseModal} size="large">
                <CloseIcon />
              </IconButton>
            </div>
          </DialogTitle>

          <DialogContent className={styles.header}>{Header}</DialogContent>
          <DialogContent>{children && children}</DialogContent>

          <DialogActions>
            {Footer || <div></div>}

            <div className={styles.footerButtons}>
              {hasCancelButton && (
                <Button className={styles.cancelButton} onClick={handleCloseModal} variant="text">
                  {closeButtonText}
                </Button>
              )}

              {!hideSubmitButton && (
                <Button
                  color={theme === 'dark' ? 'inherit' : 'primary'}
                  disabled={submitDisabled || isLoading}
                  form="modal-form"
                  onClick={handleSaveModal}
                  startIcon={isLoading && <CircularProgress size={20} />}
                  variant="contained"
                >
                  {submitButtonText}
                </Button>
              )}
            </div>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default Modal;
