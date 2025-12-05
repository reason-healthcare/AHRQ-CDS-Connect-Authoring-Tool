import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface CodeData {
  code: string;
  systemName: string;
  display: string;
}

interface CodeDetailsTableProps {
  codeData: CodeData;
}

const CodeDetailsTable: React.FC<CodeDetailsTableProps> = ({ codeData }) => {
  return (
    <TableContainer>
      <Table aria-label="code details table">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Code System</TableCell>
            <TableCell>Display</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          <TableRow>
            <TableCell>{codeData.code}</TableCell>
            <TableCell>{codeData.systemName}</TableCell>
            <TableCell>{codeData.display}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CodeDetailsTable;


