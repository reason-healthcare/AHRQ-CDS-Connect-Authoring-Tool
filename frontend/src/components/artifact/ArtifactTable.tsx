import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';

import ArtifactTableRow from './ArtifactTableRow';
import { sortByName, sortByVersion, sortByDateEdited, sortByDateCreated } from 'utils/sort';
import type { Artifact } from '../../types/artifact';

interface ArtifactTableProps {
  artifacts: Artifact[];
  handleDeleteArtifact: (artifact: Artifact) => Promise<void>;
  handleDuplicateArtifact: (artifactProps: { _id: string }) => Promise<void>;
  handleUpdateArtifact: (artifact: Artifact, artifactProps: Partial<Artifact>) => Promise<void>;
}

const ArtifactTable: React.FC<ArtifactTableProps> = ({
  artifacts,
  handleDeleteArtifact,
  handleDuplicateArtifact,
  handleUpdateArtifact
}) => {
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(3);
  const [sortAsc, setSortAsc] = useState(true);

  const columns = [
    { columnName: 'Artifact Name', columnSortHandler: sortByName },
    { columnName: 'Version', columnSortHandler: sortByVersion },
    { columnName: 'FHIR Version', columnSortHandler: sortByVersion },
    { columnName: 'Last Changed', columnSortHandler: sortByDateEdited },
    { columnName: 'Date Created', columnSortHandler: sortByDateCreated }
  ];

  const handleRequestSort = (columnIndex: number): void => {
    setSelectedColumnIndex(columnIndex);
    setSortAsc(columnIndex === selectedColumnIndex ? !sortAsc : true);
  };

  const getActiveSort = () => {
    const activeSort = columns[selectedColumnIndex].columnSortHandler;
    return (a: Artifact, b: Artifact) => (sortAsc ? 1 : -1) * activeSort(a as never, b as never);
  };

  const sortedArtifacts = [...artifacts].sort(getActiveSort());

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index}>
                <TableSortLabel
                  active={selectedColumnIndex === index}
                  direction={sortAsc ? 'asc' : 'desc'}
                  onClick={() => handleRequestSort(index)}
                >
                  {column.columnName}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedArtifacts.map(artifact => (
            <TableRow key={artifact._id}>
              <ArtifactTableRow
                artifact={artifact}
                handleDeleteArtifact={handleDeleteArtifact}
                handleDuplicateArtifact={handleDuplicateArtifact}
                handleUpdateArtifact={handleUpdateArtifact}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ArtifactTable;
