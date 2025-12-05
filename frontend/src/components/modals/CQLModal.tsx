import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal, CqlViewer } from 'components/elements';
import { viewCql } from 'queries/artifacts';
import type { Artifact, DataModel } from '../../types/artifact';
import type { ViewCqlResponse, CqlFile } from '../../types/query';

interface CQLModalProps {
  handleCloseModal: () => void;
  artifact: Artifact;
  dataModel: DataModel;
}

const CQLModal: React.FC<CQLModalProps> = ({ handleCloseModal, artifact, dataModel }) => {
  const [executionError, setExecutionError] = useState<string | null>(null);
  // For now we just show a single CQL file
  const [cqlFile, setCqlFile] = useState<CqlFile | null>(null);
  const { mutateAsync: asyncViewCql, isPending: isLoading } = useMutation({
    mutationFn: viewCql
  });

  useEffect(() => {
    let isSubscribed = true;
    const loadCql = async (): Promise<void> => {
      try {
        const response = (await asyncViewCql({ artifact, dataModel })) as ViewCqlResponse;
        if (response.cqlFiles && response.cqlFiles.length > 0) {
          // Only update the state if the component is still mounted
          if (isSubscribed) setCqlFile(response.cqlFiles[0]);
        }
      } catch (error) {
        if (isSubscribed) setExecutionError('Error retrieving CQL');
        return;
      }
    };
    loadCql();
    return () => {
      isSubscribed = false; // Cancel subscription if unmounting
    };
  }, [artifact, dataModel, asyncViewCql]);

  return (
    <Modal
      title={cqlFile ? `${cqlFile.name}.cql` : 'Loading...'}
      submitButtonText="Close"
      isOpen
      handleCloseModal={handleCloseModal}
      handleSaveModal={handleCloseModal}
    >
      <div>
        {isLoading && 'Loading CQL'}
        {cqlFile && <CqlViewer code={cqlFile.text} />}
        {executionError}
      </div>
    </Modal>
  );
};

export default CQLModal;
