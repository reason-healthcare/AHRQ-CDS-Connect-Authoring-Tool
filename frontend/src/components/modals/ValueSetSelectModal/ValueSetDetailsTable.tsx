import React, { memo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

import fetchValueSetDetails from 'queries/fetchValueSetDetails';
import type { ValueSetDetails } from '../../../types/query';
import { useTextStyles } from 'styles/hooks';

interface ValueSetDetailsTableProps {
  valueSetOid: string;
}

const ValueSetDetailsTable: React.FC<ValueSetDetailsTableProps> = ({ valueSetOid }) => {
  const textStyles = useTextStyles();
  const apiKey = useAppSelector(state => state.vsac.apiKey);

  const query = { oid: valueSetOid, apiKey: apiKey || '' };
  const { isLoading, isSuccess, data, error } = useQuery<ValueSetDetails['codes']>({
    queryKey: ['valueSetDetails', query],
    queryFn: () => fetchValueSetDetails(query),
    retry: false,
    enabled: Boolean(apiKey)
  });

  return (
    <>
      {error && <Alert severity="error">{(error as Error).message}</Alert>}
      {isLoading && <CircularProgress />}

      {isSuccess && data && (
        <TableContainer>
          <Table aria-label="value set details table">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell className={textStyles.noWrap}>Code System</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map(code => (
                <TableRow key={code.code}>
                  <TableCell>{code.code}</TableCell>
                  <TableCell>{code.displayName}</TableCell>
                  <TableCell>{code.codeSystemName || code.codeSystemURI}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default memo(ValueSetDetailsTable);
