import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
// eslint-disable-next-line import/no-unresolved
import { useAppDispatch } from '../../../store/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';

import ExternalCqlTableRow from './ExternalCqlTableRow';
import { loadArtifact } from 'actions/artifacts';
import { fetchArtifact, saveArtifact } from 'queries/artifacts';
import { deleteExternalCql } from 'queries/external-cql';
import { sortByName, sortByVersion, sortByDateEdited } from 'utils/sort';
import { useTextStyles } from 'styles/hooks';
import type { ExternalCqlLibrary } from 'types/query';
import type { Artifact } from 'types/artifact';

interface ExternalCqlTableProps {
  externalCqlList: Array<
    ExternalCqlLibrary & {
      version?: string;
      fhirVersion?: string;
      updatedAt?: string;
      details?: {
        dependencies?: Array<{ path?: string; version?: string; [key: string]: unknown }>;
        [key: string]: unknown;
      };
    }
  >;
}

const ExternalCqlTable: React.FC<ExternalCqlTableProps> = ({ externalCqlList }) => {
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(3);
  const [sortAsc, setSortAsc] = useState(true);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const textStyles = useTextStyles();
  const artifact = useSelector((state: { artifacts: { artifact: Artifact } }) => state.artifacts.artifact) as Artifact;
  const librariesInUse = useSelector(
    (state: { artifacts: { librariesInUse: string[] } }) => state.artifacts.librariesInUse
  );
  const { mutate: invokeFetchArtifact } = useMutation({
    mutationFn: fetchArtifact
  });
  const handleLoadArtifact = useCallback(
    (id: string) => {
      invokeFetchArtifact(
        { artifactId: id },
        {
          onSuccess: data => {
            dispatch(loadArtifact(data));
          }
        }
      );
    },
    [invokeFetchArtifact, dispatch]
  );
  const { mutate: invokeSaveArtifact } = useMutation({
    mutationFn: saveArtifact
  });
  const handleSaveArtifact = useCallback(() => {
    invokeSaveArtifact(
      { artifact },
      {
        onSuccess: data => {
          dispatch(loadArtifact(data));
        }
      }
    );
  }, [invokeSaveArtifact, artifact, dispatch]);
  const deleteMutation = useMutation({
    mutationFn: deleteExternalCql,
    onSuccess: async () => {
      if (artifact._id) {
        await queryClient.refetchQueries({ queryKey: ['externalCql', { artifactId: artifact._id }] });
        queryClient.invalidateQueries({ queryKey: ['modifiers'] });
        handleLoadArtifact(artifact._id);
      }
    }
  });
  const handleDeleteLibrary = async (library: ExternalCqlLibrary) => {
    handleSaveArtifact();
    deleteMutation.mutate({ library });
  };

  const columns = [
    { columnName: 'Library', columnSortHandler: sortByName },
    { columnName: 'Version', columnSortHandler: sortByVersion },
    {
      columnName: (
        <>
          FHIR<sup>®</sup>&nbsp;Version
        </>
      ),
      columnSortHandler: sortByVersion
    },
    { columnName: 'Last Updated', columnSortHandler: sortByDateEdited }
  ];

  const handleRequestSort = (columnIndex: number): void => {
    setSelectedColumnIndex(columnIndex);
    setSortAsc(columnIndex === selectedColumnIndex ? !sortAsc : true);
  };

  const getActiveSort = () => {
    const activeSort = columns[selectedColumnIndex].columnSortHandler;
    return (
      a: ExternalCqlLibrary & { name?: string; version?: string; updatedAt?: string },
      b: ExternalCqlLibrary & { name?: string; version?: string; updatedAt?: string }
    ) => {
      // Ensure required properties exist for sort functions
      const aWithDefaults = { name: a.name || '', version: a.version || '', ...a };
      const bWithDefaults = { name: b.name || '', version: b.version || '', ...b };
      return (sortAsc ? 1 : -1) * activeSort(aWithDefaults, bWithDefaults);
    };
  };

  const isADependency = (library: ExternalCqlLibrary & { name?: string; version?: string }): boolean =>
    externalCqlList.some(externalCqlLibrary =>
      externalCqlLibrary.details?.dependencies?.some(
        dependency => dependency.path === library.name && dependency.version === library.version
      )
    );

  const disableDeleteMessage = (library: ExternalCqlLibrary & { name?: string }): string | null => {
    if (library.name && librariesInUse.includes(library.name))
      return 'To delete this library, first remove all references to it.';
    else if (isADependency(library)) return 'To delete this library, first remove all libraries that depend on it.';
    else return null;
  };

  return externalCqlList.length > 0 ? (
    <TableContainer>
      <Table aria-label="external cql table">
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index}>
                <TableSortLabel
                  id={String(index)}
                  className={textStyles.noWrap}
                  direction={selectedColumnIndex !== index || sortAsc ? 'asc' : 'desc'}
                  active={selectedColumnIndex === index}
                  onClick={() => handleRequestSort(index)}
                >
                  {column.columnName}
                </TableSortLabel>
              </TableCell>
            ))}

            <TableCell></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {externalCqlList.sort(getActiveSort()).map(library => (
            <TableRow key={library._id}>
              <ExternalCqlTableRow
                disableDeleteMessage={disableDeleteMessage(library)}
                library={library}
                handleDeleteLibrary={handleDeleteLibrary}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <div>No external CQL libraries to show.</div>
  );
};

export default ExternalCqlTable;
