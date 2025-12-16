import React from 'react';
import { Alert } from '@mui/material';

interface CodeSelectModalFooterProps {
  isValidCode?: boolean | null;
}

const CodeSelectModalFooter: React.FC<CodeSelectModalFooterProps> = ({ isValidCode }) => (
  <div>
    {isValidCode && <Alert severity="success">Validation Successful!</Alert>}

    {isValidCode === false && (
      <Alert severity="error">
        Validation Error: Unable to validate code and/or code system. Please try again, or select this code without
        validation.
      </Alert>
    )}
  </div>
);

export default CodeSelectModalFooter;
