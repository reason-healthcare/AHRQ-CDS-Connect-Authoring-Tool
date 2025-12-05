import React from 'react';
import { Tooltip as MuiTooltip } from '@mui/material';
import type { TooltipProps as MuiTooltipProps } from '@mui/material';

interface TooltipProps extends Omit<MuiTooltipProps, 'children'> {
  children: React.ReactElement;
  enabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, enabled = true, ...tooltipProps }) =>
  enabled ? (
    <MuiTooltip arrow {...tooltipProps}>
      <span>{children}</span>
    </MuiTooltip>
  ) : (
    <span>{children}</span>
  );

export default Tooltip;
