import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';

import { EditorsTemplate } from 'components/builder/templates';
import type { Parameter } from '../../types/artifact';
import { useTextStyles } from 'styles/hooks';

interface TestingParameterProps {
  handleUpdateParameter: (newValue: string | number | Record<string, unknown> | null) => void;
  parameter: Parameter;
}

const TestingParameter: React.FC<TestingParameterProps> = ({ handleUpdateParameter, parameter }) => {
  const textStyles = useTextStyles();
  const { name, type, uniqueId, value } = parameter;

  return (
    <Card id={uniqueId}>
      <CardHeader
        disableTypography
        title={
          <>
            <span className={textStyles.bold}>Parameter: </span>
            {name}
          </>
        }
      />

      <CardContent>
        <EditorsTemplate handleUpdateEditor={handleUpdateParameter} label="Value" type={type} value={value} />
      </CardContent>
    </Card>
  );
};

export default TestingParameter;


