import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

// eslint-disable-next-line import/no-unresolved
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

import { saveArtifact, downloadArtifact, fetchArtifact, initializeArtifact } from 'queries/artifacts';
import { fetchExternalCqlList } from 'queries/external-cql';
import type { ExternalCqlLibrary } from '../../../types/query';
import { artifactSaved, loadArtifact } from 'actions/artifacts';
import { setScrollToId } from 'actions/navigation';
import { useSpacingStyles } from 'styles/hooks';
import useStyles from './styles';

import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceTabs from './WorkspaceTabs';
import type { ELMError } from '../../modals/ELMErrorModal';
import isBlankArtifact from 'utils/artifacts/isBlankArtifact';
import { ErrorPage } from 'components/base';

const Workspace: React.FC = () => {
  const spacingStyles = useSpacingStyles();
  const styles = useStyles();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const artifactRef = useRef<{ _id?: string | null; name?: string } | null>(null);
  const { id } = useParams<{ id?: string }>();
  const [statusMessage, setStatusMessage] = useState('');
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const scrollToId = useAppSelector(state => state.navigation.scrollToId);
  const externalCqlQuery = { artifactId: id || '' };
  const { data: externalCqlList } = useQuery<ExternalCqlLibrary[]>({
    queryKey: ['externalCql', externalCqlQuery],
    queryFn: () => fetchExternalCqlList(externalCqlQuery),
    enabled: externalCqlQuery.artifactId != null && externalCqlQuery.artifactId !== ''
  });
  const { mutate: invokeFetchArtifact, isPending: isLoading } = useMutation({
    mutationFn: fetchArtifact
  });
  const handleLoadArtifact = useCallback(
    (artifactId: string) => {
      invokeFetchArtifact(
        { artifactId: artifactId },
        {
          onSuccess: data => {
            dispatch(loadArtifact(data));
          }
        }
      );
    },
    [invokeFetchArtifact, dispatch]
  );
  const { mutate: invokeInitializeArtifact } = useMutation({
    mutationFn: initializeArtifact
  });
  const handleInitializeArtifact = useCallback(
    () =>
      invokeInitializeArtifact(undefined, {
        onSuccess: data => {
          dispatch(loadArtifact(data));
        }
      }),
    [invokeInitializeArtifact, dispatch]
  );
  const { mutate: invokeSaveArtifact } = useMutation({
    mutationFn: saveArtifact
  });
  const handleSaveArtifact = useCallback(
    (
      artifactToSave: { _id?: string | null; name?: string; [key: string]: unknown },
      artifactProps: Record<string, unknown>,
      updateStatusMessage = true
    ) =>
      invokeSaveArtifact(
        { artifact: artifactToSave as never, artifactProps },
        {
          onSuccess: data => {
            queryClient.invalidateQueries({ queryKey: ['artifacts'] });
            dispatch(artifactSaved(data));
            if (updateStatusMessage) setStatusMessage(`Last saved ${moment().format('dddd, MMMM Do YYYY, h:mm:ss a')}`);
          },
          onError: (error: Error) => {
            if (updateStatusMessage) setStatusMessage(`Save failed. ${error.message ?? 'Unknown error'}`);
          }
        }
      ),
    [invokeSaveArtifact, queryClient, dispatch]
  );
  const { mutateAsync: invokeDownloadArtifact } = useMutation({
    mutationFn: downloadArtifact,
    onSuccess: () => {
      setStatusMessage(`Downloaded ${moment().format('dddd, MMMM Do YYYY, h:mm:ss a')}`);
    },
    onError: (error: Error) => {
      setStatusMessage(`Download failed. ${error.message ?? 'Unknown error'}.`);
    }
  });

  // Scroll when navigating to an element from a link
  useEffect(() => {
    const elementToScrollTo = document.getElementById(scrollToId || '');
    if (elementToScrollTo) elementToScrollTo.scrollIntoView();
    dispatch(setScrollToId(null));
  }, [scrollToId, dispatch]);

  // Load the artifact id specified in the URL into the global redux state
  useEffect(() => {
    if (id == null) {
      handleInitializeArtifact();
    } else {
      handleLoadArtifact(id);
    }
    // NOTE: This is only safe because this useEffect should only run when the component mounts
    // It will never re-run, but that is what we want in this case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track ref to use when saving when unmounting
  useEffect(() => {
    artifactRef.current = artifact;
  }, [artifact]);

  // Save artifact on unmount
  // Note: unmount happens when the component unmounts within the AT react app.
  // It isn't called when refreshing the page or navigating away from the AT.
  useEffect(() => {
    return () => {
      if (artifactRef.current && !isBlankArtifact(artifactRef.current)) {
        handleSaveArtifact(artifactRef.current, {}, false);
      }
    };
  }, [handleSaveArtifact]);

  if (artifact == null) {
    if (isLoading) {
      return <CircularProgress />;
    }
    return <ErrorPage errorType="notFound" />;
  }

  return (
    <div className={styles.root}>
      <div className={spacingStyles.globalPadding}>
        <div className={styles.workspace}>
          <WorkspaceHeader
            handleDownloadArtifact={async (artifactToDownload, dataModel) => {
              try {
                const result = await invokeDownloadArtifact({ artifact: artifactToDownload, dataModel });
                return result as { elmErrors?: ELMError[] } | undefined;
              } catch (error) {
                console.error('Download artifact failed:', error);
                return undefined;
              }
            }}
            handleSaveArtifact={handleSaveArtifact}
            statusMessage={statusMessage}
          />
          <WorkspaceTabs externalCqlList={externalCqlList ?? []} handleSaveArtifact={handleSaveArtifact} />
        </div>
      </div>
    </div>
  );
};

export default Workspace;
