import React, { memo, useEffect, useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  BedtimeOutlined as BedtimeIcon,
  KeyboardArrowDown as DownArrowIcon,
  KeyboardArrowUp as UpArrowIcon,
  PendingActions as PendingActionsIcon,
  ScienceOutlined as ScienceIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import moment from 'moment';

import { Tooltip } from 'components/elements';
import searchVSACByKeyword from 'queries/searchVSACByKeyword';
import type { ValueSetSearchResponse, ValueSetSearchResult } from '../../../types/query';
import { useInteractiveStyles, useTextStyles } from 'styles/hooks';
import useStyles from './styles';

interface ValueSet {
  name: string;
  oid: string;
}

interface ValueSetSearchResultRowProps {
  handleViewValueSetDetails: (event: React.MouseEvent, valueSet: ValueSet) => void;
  handleSaveValueSetSelection: (valueSet: ValueSet) => void;
  valueSet: ValueSetSearchResult;
}

const ValueSetSearchResultRow: React.FC<ValueSetSearchResultRowProps> = ({
  handleViewValueSetDetails,
  handleSaveValueSetSelection,
  valueSet
}) => {
  const textStyles = useTextStyles();
  const interactiveStyles = useInteractiveStyles();
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <>
      <TableRow
        className={interactiveStyles.pointer}
        hover
        key={valueSet.oid}
        onClick={() => handleSaveValueSetSelection({ name: valueSet.name, oid: valueSet.oid })}
      >
        <TableCell>
          <Stack alignItems="center" direction="row" justifyContent="space-between">
            <Stack alignItems="center" direction="row" justifyContent="flex-start">
              <IconButton
                aria-label={`Expand details for ${valueSet.name}`}
                color="primary"
                onClick={event => {
                  event.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                size="large"
              >
                {isExpanded ? <UpArrowIcon fontSize="small" /> : <DownArrowIcon fontSize="small" />}
              </IconButton>

              <div>
                <div>{valueSet.name}</div>
                <div className={textStyles.subtext}>{valueSet.oid}</div>
              </div>
            </Stack>

            <Stack direction="row">
              {valueSet.experimental && (
                <Tooltip title="Experimental">
                  <ScienceIcon />
                </Tooltip>
              )}
              {valueSet.status === 'retired' && (
                <Tooltip title="Retired">
                  <BedtimeIcon />
                </Tooltip>
              )}
              {valueSet.status === 'draft' && (
                <Tooltip title="Draft">
                  <PendingActionsIcon />
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </TableCell>
        <TableCell>{valueSet.steward || ''}</TableCell>
        <TableCell>
          <table className={styles.simpleTable}>
            <tbody>
              {valueSet.lastReviewDate ? (
                <tr className={textStyles.noWrap}>
                  <td>Reviewed:</td>
                  <td>{moment(valueSet.lastReviewDate, 'YYYY-MM-DD').format('MMM D, YYYY')}</td>
                </tr>
              ) : null}
              {valueSet.date ? (
                <tr className={textStyles.noWrap}>
                  <td>Updated:</td>
                  <td>{moment(valueSet.date, 'YYYY-MM-DD').format('MMM D, YYYY')}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableCell>
        <TableCell>
          <div className={textStyles.noWrap}>
            {valueSet.codeCount}
            <IconButton
              aria-label={`View Value Set ${valueSet.name}`}
              color="primary"
              onClick={event => handleViewValueSetDetails(event, { name: valueSet.name, oid: valueSet.oid })}
              size="large"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ padding: 0 }} colSpan={6}>
          <Collapse in={isExpanded} unmountOnExit>
            <div className={styles.collapseRow}>
              {!valueSet.description && !valueSet.purpose && <div>No additional information provided</div>}
              {valueSet.description && (
                <div>
                  <span className={textStyles.bold}>Description:</span> {valueSet.description}
                </div>
              )}
              {valueSet.purpose?.clinicalFocus && (
                <div>
                  <span className={textStyles.bold}>Clinical Focus:</span> {valueSet.purpose.clinicalFocus}
                </div>
              )}
              {valueSet.purpose?.dataElementScope && (
                <div>
                  <span className={textStyles.bold}>Data Element Scope:</span> {valueSet.purpose.dataElementScope}
                </div>
              )}
              {valueSet.purpose?.inclusionCriteria && (
                <div>
                  <span className={textStyles.bold}>Inclusion Criteria:</span> {valueSet.purpose.inclusionCriteria}
                </div>
              )}
              {valueSet.purpose?.exclusionCriteria && (
                <div>
                  <span className={textStyles.bold}>Exclusion Criteria:</span> {valueSet.purpose.exclusionCriteria}
                </div>
              )}
              {valueSet.purpose?.purpose && (
                <div>
                  <span className={textStyles.bold}>Purpose:</span> {valueSet.purpose.purpose}
                </div>
              )}
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

interface ValueSetSearchResultsTableProps {
  keyword: string | null;
  setSearchCount: (count: { count: number; total: number }) => void;
  setSelectedValueSet: (valueSet: ValueSet | null) => void;
  handleSaveValueSetSelection: (valueSet: ValueSet) => void;
  handleCloseModal: () => void;
}

const ValueSetSearchResultsTable: React.FC<ValueSetSearchResultsTableProps> = ({
  keyword,
  setSearchCount,
  setSelectedValueSet,
  handleSaveValueSetSelection
}) => {
  const apiKey = useAppSelector(state => state.vsac.apiKey);
  const textStyles = useTextStyles();

  const query = { keyword: keyword || '', apiKey: apiKey || '' };
  const { isLoading, isSuccess, data, error } = useQuery({
    queryKey: ['searchVSACByKeyword', query],
    queryFn: () => searchVSACByKeyword(query),
    enabled: keyword != null && Boolean(apiKey)
  }) as { isLoading: boolean; isSuccess: boolean; data: ValueSetSearchResponse | undefined; error: Error | null };

  const searchResultCount = data?.count;
  const searchResultTotal = data?.total;

  const handleViewValueSetDetails = (event: React.MouseEvent, valueSet: ValueSet): void => {
    event.stopPropagation();
    setSelectedValueSet({ name: valueSet.name, oid: valueSet.oid });
  };

  useEffect(() => {
    if (searchResultCount != null) setSearchCount({ count: searchResultCount, total: searchResultTotal });
  }, [searchResultCount, searchResultTotal, setSearchCount]);

  return (
    <>
      {error && <Alert severity="error">{(error as Error).message}</Alert>}
      {isLoading && <CircularProgress />}

      {isSuccess && data && (
        <TableContainer>
          <Table aria-label="value set search results table">
            <TableHead>
              <TableRow>
                <TableCell>Value Set</TableCell>
                <TableCell>Steward</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell className={textStyles.noWrap}>Codes</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.results?.map(valueSet => (
                <ValueSetSearchResultRow
                  key={valueSet.oid}
                  handleViewValueSetDetails={handleViewValueSetDetails}
                  handleSaveValueSetSelection={handleSaveValueSetSelection}
                  valueSet={valueSet}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default memo(ValueSetSearchResultsTable);
