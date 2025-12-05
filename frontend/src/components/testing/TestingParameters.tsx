import React from 'react';

import TestingParameter from './TestingParameter';
import type { Parameter } from '../../types/artifact';

interface TestingParametersProps {
  handleUpdateParameters: (parameters: Parameter[]) => void;
  parameters: Parameter[];
}

const TestingParameters: React.FC<TestingParametersProps> = ({ handleUpdateParameters, parameters }) => {
  const handleUpdateParameter = (
    parameter: Parameter,
    newValue: string | number | Record<string, unknown> | null,
    index: number
  ): void => {
    const params = [...parameters];
    params[index] = { ...parameter, value: newValue };
    handleUpdateParameters(params);
  };

  return (
    <>
      {parameters.length > 0 ? <br /> : ''}
      {parameters.map((parameter, index) => (
        <TestingParameter
          key={`param-${index}`}
          parameter={parameter}
          handleUpdateParameter={newValue => handleUpdateParameter(parameter, newValue, index)}
        />
      ))}
    </>
  );
};

export default TestingParameters;


