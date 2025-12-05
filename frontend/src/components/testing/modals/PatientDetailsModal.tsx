import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import PatientCard from '../PatientCard';
import PatientDataSection from '../PatientDataSection';
import PatientJSONDataViewer from '../PatientJSONDataViewer';
import { Modal } from 'components/elements';
import { extractOtherPatientResourceData, extractPatientResourceData } from 'utils/patients';
import type { PatientData } from '../../../types/patient';
import useStyles from '../styles';

interface PatientDetailsModalProps {
  handleCloseModal: () => void;
  patient: PatientData;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ handleCloseModal, patient }) => {
  const styles = useStyles();

  return (
    <Modal
      closeButtonText="Close"
      handleCloseModal={handleCloseModal}
      handleSaveModal={handleCloseModal}
      hasCancelButton
      hideSubmitButton
      isOpen
      title="View Patient Details"
    >
      <>
        <PatientCard patient={patient} />

        <Tabs selectedTabClassName={styles.patientDataTabSelected}>
          <TabList aria-label="Patient Data Tabs" className={styles.patientDataTabList}>
            <Tab className={styles.patientDataTab}>Summary</Tab>
            <Tab className={styles.patientDataTab}>Details</Tab>
          </TabList>
          <TabPanel>
            <PatientDataSection
              title="Organizations"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'Organization')}
            />
            <PatientDataSection
              title="Conditions"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'Condition')}
            />
            <PatientDataSection
              title="Allergies"
              data={extractPatientResourceData(
                { fhirVersion: patient.fhirVersion || 'R4', patient },
                'AllergyIntolerance'
              )}
            />
            <PatientDataSection
              title="Medications"
              data={extractPatientResourceData(
                { fhirVersion: patient.fhirVersion || 'R4', patient },
                'MedicationRequest'
              )}
            />
            <PatientDataSection
              title="Devices"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'Device')}
            />
            <PatientDataSection
              title="Careplans"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'CarePlan')}
            />
            <PatientDataSection
              title="Encounters"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'Encounter')}
            />
            <PatientDataSection
              title="Observations"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'Observation')}
            />
            <PatientDataSection
              title="Immunizations"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'Immunization')}
            />
            <PatientDataSection
              title="Procedures"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'Procedure')}
            />
            <PatientDataSection
              title="Imaging"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'ImagingStudy')}
            />
            <PatientDataSection
              title="Diagnostics"
              data={extractPatientResourceData(
                { fhirVersion: patient.fhirVersion || 'R4', patient },
                'DiagnosticReport'
              )}
            />
            <PatientDataSection
              title="Claims"
              data={extractPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient }, 'Claim')}
            />
            <PatientDataSection
              title="Other"
              data={extractOtherPatientResourceData({ fhirVersion: patient.fhirVersion || 'R4', patient })}
            />
          </TabPanel>
          <TabPanel>
            <PatientJSONDataViewer
              data={patient.patient || { resourceType: 'Bundle', type: 'collection', entry: [] }}
            />
          </TabPanel>
        </Tabs>
      </>
    </Modal>
  );
};

export default PatientDetailsModal;
