import React from 'react';
import { Box, Button, Card, IconButton, Stack } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import { produce } from 'immer';
import _ from 'lodash';

import { Dropdown } from 'components/elements';
import type { Subpopulation } from '../../../types/artifact';

const deleteSubpopulation = produce((subpopulations: Subpopulation[], index: number) => {
  subpopulations.splice(index, 1);
});

interface RecommendationSubpopulationsProps {
  artifactSubpopulations: Subpopulation[];
  handleUpdateSubpopulations: (subpopulations: Subpopulation[]) => void;
  recommendationSubpopulations: Subpopulation[];
  setShowAddSubpopulation: (show: boolean) => void;
  showAddSubpopulation: boolean;
  subpopulationOptions: Subpopulation[];
}

const RecommendationSubpopulations: React.FC<RecommendationSubpopulationsProps> = ({
  artifactSubpopulations,
  handleUpdateSubpopulations,
  recommendationSubpopulations,
  setShowAddSubpopulation,
  showAddSubpopulation,
  subpopulationOptions
}) => {
  const selectRecommendationSubpopulation = (subpopulationId: string) => {
    const subpopulation = artifactSubpopulations.find(({ uniqueId }) => uniqueId === subpopulationId);
    if (subpopulation) {
      handleUpdateSubpopulations(recommendationSubpopulations.concat([_.cloneDeep(subpopulation)]));
      setShowAddSubpopulation(false);
    }
  };

  return (
    <Stack my={2}>
      <Box>
        If all of the following apply...
        {recommendationSubpopulations.map((subpopulation, index) => (
          <Card
            key={subpopulation.uniqueId || index}
            sx={{
              alignItems: 'center',
              backgroundColor: 'common.white',
              display: 'flex',
              justifyContent: 'space-between',
              margin: '1em 0',
              padding: '0.4em 1em'
            }}
          >
            {subpopulation.subpopulationName}

            <IconButton
              aria-label="remove subpopulation"
              color="primary"
              onClick={() => handleUpdateSubpopulations(deleteSubpopulation(recommendationSubpopulations, index))}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Card>
        ))}
      </Box>

      {subpopulationOptions.length > 0 && !showAddSubpopulation && (
        <Box>
          <Button color="primary" onClick={() => setShowAddSubpopulation(true)} variant="contained">
            Add subpopulation
          </Button>
        </Box>
      )}

      {showAddSubpopulation && (
        <Stack alignItems="center" direction="row" my={1}>
          <Dropdown
            SelectProps={{
              SelectDisplayProps: { 'data-testid': 'add-subpopulation' } as React.HTMLAttributes<HTMLDivElement>
            }}
            label="Add a subpopulation"
            labelKey="subpopulationName"
            onChange={event => selectRecommendationSubpopulation(event.target.value)}
            options={
              subpopulationOptions as Array<
                | string
                | number
                | {
                    label?: string;
                    value: string | number;
                    [key: string]: string | number | boolean | React.ReactNode | undefined;
                  }
              >
            }
            sx={{ marginRight: '10px' }}
            value=""
            valueKey="uniqueId"
          />

          <IconButton
            aria-label="clear add subpopulation"
            color="primary"
            onClick={() => setShowAddSubpopulation(false)}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
};

export default RecommendationSubpopulations;
