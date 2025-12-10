import React from 'react';
import { Alert, Stack } from '@mui/material';
import _ from 'lodash';

import { ArgumentsTemplate } from 'components/builder/templates';
import { getTypeByCqlArgument, type CqlArgument } from 'components/builder/editors/utils';

interface ExternalCqlArgument {
  name: string;
  value?: {
    argSource?: string;
    selected?: string;
    elementName?: string;
    elementType?: string;
    type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ExternalCqlTemplateProps {
  externalCqlArguments: ExternalCqlArgument[];
  handleUpdateExternalCqlArguments: (args: ExternalCqlArgument[]) => void;
}

const ExternalCqlTemplate: React.FC<ExternalCqlTemplateProps> = ({
  externalCqlArguments,
  handleUpdateExternalCqlArguments
}) => {
  const allArgumentsComplete = (): boolean => {
    return externalCqlArguments
      ? externalCqlArguments.every(
          cqlArgument =>
            cqlArgument.value &&
            typeof cqlArgument.value === 'object' &&
            cqlArgument.value !== null &&
            cqlArgument.value.selected !== undefined &&
            cqlArgument.value.selected !== ''
        )
      : true;
  };

  const handleSelectExternalCqlArgument = (newArgValue: ExternalCqlArgument['value'], index: number): void => {
    const newExternalCqlArguments = _.cloneDeep(externalCqlArguments);
    if (newExternalCqlArguments[index]) {
      newExternalCqlArguments[index].value = newArgValue;
    }
    handleUpdateExternalCqlArguments(newExternalCqlArguments);
  };

  return (
    <Stack data-testid="external-cql-template">
      {!allArgumentsComplete() && (
        <Alert severity="warning">
          All fields for standalone External CQL functions are required. Enter valid values for each field.
        </Alert>
      )}

      {externalCqlArguments?.map((cqlArgument, index) => (
        <ArgumentsTemplate
          key={index}
          argumentLabel={cqlArgument.name}
          argumentType={getTypeByCqlArgument(cqlArgument as CqlArgument)}
          argumentValue={
            externalCqlArguments[index]?.value as
              | {
                  argSource?: string;
                  selected?: string;
                  elementName?: string;
                  elementType?: string;
                  type?: string;
                  [key: string]: unknown;
                }
              | undefined
          }
          handleUpdateArgument={newValue => {
            handleSelectExternalCqlArgument(newValue as ExternalCqlArgument['value'], index);
          }}
        />
      ))}
    </Stack>
  );
};

export default ExternalCqlTemplate;
