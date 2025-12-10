import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircularProgress } from '@mui/material';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

import ExternalCqlDropZone from './ExternalCqlDropZone';
import ExternalCqlTable from './ExternalCqlTable';
import { fetchExternalCqlList } from 'queries/external-cql';
import type { ExternalCqlLibrary } from '../../../types/query';

const ExternalCql: React.FC = () => {
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const query = { artifactId: artifact?._id || '' };
  const { data: externalCqlList, isLoading } = useQuery<ExternalCqlLibrary[]>({
    queryKey: ['externalCql', query],
    queryFn: () => fetchExternalCqlList(query),
    enabled: artifact?._id != null
  });

  return (
    <>
      <ExternalCqlDropZone />

      {isLoading ? <CircularProgress /> : <ExternalCqlTable externalCqlList={externalCqlList ?? []} />}
    </>
  );
};

export default ExternalCql;
