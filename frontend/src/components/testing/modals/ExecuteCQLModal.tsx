import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';

import TestingParameters from '../TestingParameters';
import { Dropdown, Modal } from 'components/elements';
import { fetchArtifacts } from 'queries/artifacts';
import type { Artifact, Parameter } from '../../../types/artifact';
import type { PatientData, PatientBundle } from '../../../types/patient';
import fhirVersionMap from 'data/fhirVersionMap';

interface ExecuteCQLModalProps {
  patients: PatientData[];
  handleCloseModal: () => void;
  handleExecuteCQL: (params: {
    artifact: Artifact;
    params: Parameter[];
    dataModel: { name: string; version: string };
    selectedPatients: PatientBundle[];
  }) => void;
}

const ExecuteCQLModal: React.FC<ExecuteCQLModalProps> = ({ patients, handleCloseModal, handleExecuteCQL }) => {
  const [artifactToExecute, setArtifactToExecute] = useState<Artifact | null>(null);
  const [paramsToExecute, setParamsToExecute] = useState<Parameter[]>([]);
  const { data: artifacts } = useQuery<Artifact[]>({
    queryKey: ['artifacts'],
    queryFn: () => fetchArtifacts()
  });

  const fhirVersion = patients[0]?.fhirVersion;
  const validArtifactsToExecute = useMemo(
    () =>
      artifacts?.filter(
        artifact =>
          artifact.fhirVersion === '' ||
          fhirVersionMap[artifact.fhirVersion as keyof typeof fhirVersionMap] === fhirVersion
      ) || [],
    [artifacts, fhirVersion]
  );
  const artifactOptions = useMemo(
    () => validArtifactsToExecute.map(artifact => ({ value: artifact.name || '', label: artifact.name || '' })),
    [validArtifactsToExecute]
  );
  const handleSubmit = (): void => {
    if (!artifactToExecute || !fhirVersion) return;
    let version = Object.keys(fhirVersionMap).find(
      key => fhirVersionMap[key as keyof typeof fhirVersionMap] === fhirVersion
    );
    if (version === '4.0.x') {
      version = artifactToExecute.fhirVersion === '4.0.0' ? '4.0.0' : '4.0.1';
    }
    const dataModel = { name: 'FHIR', version: version || '' };

    handleExecuteCQL({
      artifact: artifactToExecute,
      params: paramsToExecute,
      dataModel,
      selectedPatients: patients.map(
        patient => patient.patient || ({ resourceType: 'Bundle', type: 'collection', entry: [] } as PatientBundle)
      )
    });
    handleCloseModal();
  };

  const selectArtifactToExecute = (artifactName: string): void => {
    const artifact = validArtifactsToExecute.find(artifact => artifact.name === artifactName);

    if (artifact) {
      let params: Parameter[] = [];
      if (artifact.parameters) {
        params = artifact.parameters.map(p => ({
          name: p.name,
          type: p.type,
          value: _.cloneDeep(p.value)
        }));
      }

      setArtifactToExecute(artifact);
      setParamsToExecute(params);
    } else {
      setArtifactToExecute(null);
      setParamsToExecute([]);
    }
  };

  return (
    <Modal
      title="Execute CQL on Selected Patients"
      handleCloseModal={handleCloseModal}
      handleSaveModal={handleSubmit}
      hasCancelButton
      isOpen
      submitButtonText="Execute CQL"
      submitDisabled={artifactToExecute == null}
    >
      <div className="patient-table__modal modal__content">
        <div className="select-label">FHIR Compatible Artifacts:</div>

        <Dropdown
          id="select-artifact"
          hiddenLabel={Boolean(artifactToExecute)}
          label={artifactToExecute ? null : 'Select...'}
          onChange={event => selectArtifactToExecute(event.target.value)}
          options={artifactOptions}
          value={artifactToExecute ? artifactToExecute.name || '' : ''}
        />

        <TestingParameters parameters={paramsToExecute} handleUpdateParameters={setParamsToExecute} />
      </div>
    </Modal>
  );
};

export default ExecuteCQLModal;
