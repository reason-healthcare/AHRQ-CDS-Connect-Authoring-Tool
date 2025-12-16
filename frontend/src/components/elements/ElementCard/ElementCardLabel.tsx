import React from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';

interface ElementCardLabelProps extends Omit<BoxProps, 'children'> {
  label?: string;
}

const ElementCardLabel: React.FC<ElementCardLabelProps> = ({ label, ...props }) => (
  <Box
    aria-label={label || 'unnamed'}
    fontSize={{ xs: '14px', xxl: '18px' }}
    fontWeight="600"
    mr={2}
    minWidth="200px"
    textAlign="right"
    {...props}
  >
    {label || <i>unnamed</i>}:
  </Box>
);

export default ElementCardLabel;
