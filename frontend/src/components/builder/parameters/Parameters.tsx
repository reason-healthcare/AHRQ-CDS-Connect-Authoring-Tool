import React, { useEffect, useState } from 'react';
import { Button, IconButton } from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

import Parameter from './Parameter';
import { Tooltip } from 'components/elements';
import { getAllElements, getElementNames } from 'components/builder/utils';
import type { Parameter as ParameterType } from '../../../types/artifact';

interface ParametersProps {
  handleUpdateParameters: (parameters: ParameterType[]) => void;
}

const Parameters: React.FC<ParametersProps> = ({ handleUpdateParameters }) => {
  const [showAllContent, setShowAllContent] = useState(true);
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { parameters } = artifact || { parameters: undefined };
  const allElements = getAllElements(artifact) ?? [];
  const elementNames = getElementNames(allElements);

  useEffect(() => {
    if ((parameters?.length || 0) === 0) setShowAllContent(true);
  }, [parameters]);

  if (!artifact) return null;

  const addParameter = (): void => {
    const newParameter: ParameterType = {
      comment: null,
      name: null,
      type: 'boolean',
      uniqueId: uuidv4()
    };
    const newParameters = (parameters || []).concat([newParameter]);
    handleUpdateParameters(newParameters);
  };

  const deleteParameter = (uniqueId: string | undefined): void => {
    const newParameters = (parameters || []).filter(p => p.uniqueId !== uniqueId);
    handleUpdateParameters(newParameters);
  };

  const updateParameter = (uniqueId: string | undefined, updatedParameter: Partial<ParameterType>): void => {
    const newParameters = (parameters || []).map(p => (p.uniqueId === uniqueId ? { ...p, ...updatedParameter } : p));
    handleUpdateParameters(newParameters);
  };

  return (
    <div>
      <div>
        <h3>Parameters</h3>
        <div>
          <Tooltip title={showAllContent ? 'Collapse all' : 'Expand all'}>
            <IconButton onClick={() => setShowAllContent(!showAllContent)} size="small">
              {showAllContent ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          <Button color="primary" onClick={addParameter} variant="contained">
            Add Parameter
          </Button>
        </div>
      </div>

      {parameters && parameters.length > 0 ? (
        parameters.map((parameter, index) => (
          <Parameter
            key={parameter.uniqueId}
            elementNames={elementNames}
            handleDeleteParameter={deleteParameter}
            handleUpdateParameter={updateParameter}
            parameter={parameter}
            showAllContent={showAllContent}
          />
        ))
      ) : (
        <div>No parameters defined.</div>
      )}
    </div>
  );
};

export default Parameters;
