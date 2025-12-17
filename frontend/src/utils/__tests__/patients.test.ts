import _ from 'lodash';
import type fhir4 from 'fhir/r4';
import type fhir3 from 'fhir/r3';
import type fhir2 from 'fhir/r2';
import { autoDetectFHIRVersion } from '../patients';
import {
  basePatient,
  dstu2Patient,
  dstu2MedicationOrderPatient,
  r4ServiceRequestPatient
} from 'mocks/patients/simple-bundles';
import { FHIRBundleEntry, PatientBundle } from '../../types/patient';

// interface PatientBundle {
//   [key: string]: unknown;
// }

describe('patient utils', () => {
  describe('autoDetectFHIRVersion', () => {
    it('should detect DSTU2 if patient last name is an array', () => {
      const patient = _.cloneDeep(dstu2Patient);
      const version = autoDetectFHIRVersion({ patient });
      expect(version).toEqual(['DSTU2']);
    });

    it("should detect DSTU2 if a MedicationOrder resource is present (and last name can't be used to make a decision", () => {
      const patient = _.cloneDeep(dstu2MedicationOrderPatient); // no last name on this patient
      const version = autoDetectFHIRVersion({ patient });
      expect(version).toEqual(['DSTU2']);
    });

    it('should detect R4 if a ServiceRequest resource is present', () => {
      const patient = _.cloneDeep(r4ServiceRequestPatient);
      const version = autoDetectFHIRVersion({ patient });
      expect(version).toEqual(['R4']);
    });

    it('should detect R4 or STU3 or DSTU2 if no identifying feature present and no name present', () => {
      const patient = _.cloneDeep(basePatient) as PatientBundle;
      const resource = (patient.entry as FHIRBundleEntry[])[0].resource as
        | fhir4.Patient
        | fhir3.Patient
        | fhir2.Patient;
      delete resource.name;
      const version = autoDetectFHIRVersion({ patient });
      expect(version).toEqual(['R4', 'STU3', 'DSTU2']);
    });

    describe('Conditions', () => {
      const baseCondition = {
        resourceType: 'Condition' as const,
        id: 'example-condition',
        subject: {
          reference: 'Patient/example-patient'
        },
        code: {
          coding: [
            {
              system: 'http://example.org',
              code: 'example-condition',
              display: 'example condition'
            }
          ]
        }
      };

      it('should detect STU3 if Condition.assertedDate is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const condition: fhir3.Condition = {
          ...baseCondition,
          assertedDate: '2024-04-01'
        } as unknown as fhir3.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseCondition } }); // first condition isn't necessarily STU3
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition }); // second condition indicates STU3
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Condition.assertedDate is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const condition: fhir3.Condition = {
          ...baseCondition,
          assertedDate: '2024-04-01'
        } as unknown as fhir3.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Condition.context is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const condition: fhir3.Condition = {
          ...baseCondition,
          context: { reference: 'Encounter/example-encounter' }
        } as unknown as fhir3.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Condition.context is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const condition: fhir3.Condition = {
          ...baseCondition,
          context: { reference: 'Encounter/example-encounter' }
        } as unknown as fhir3.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect R4 if Condition.recordedDate is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const condition: fhir4.Condition = {
          ...baseCondition,
          recordedDate: '2024-04-01'
        } as unknown as fhir4.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseCondition } }); // first condition isn't necessarily R4
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition }); // second condition indicates R4
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Condition.recordedDate is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const condition: fhir4.Condition = {
          ...baseCondition,
          recordedDate: '2024-04-01'
        } as unknown as fhir4.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseCondition } }); // first condition isn't necessarily R4
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition }); // second condition indicates R4
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Condition.encounter is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const condition: fhir4.Condition = {
          ...baseCondition,
          encounter: { reference: 'Encounter/example-encounter' }
        } as unknown as fhir4.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or DSTU2 if Condition.encounter is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir4.Patient | fhir2.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const condition: fhir4.Condition = {
          ...baseCondition,
          encounter: { reference: 'Encounter/example-encounter' }
        } as unknown as fhir4.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'DSTU2']);
      });

      it('should detect R4 if Condition.recorder is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const condition: fhir4.Condition = {
          ...baseCondition,
          recorder: { reference: 'Practitioner/example-practitioner' }
        } as unknown as fhir4.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Condition.recorder is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const condition: fhir4.Condition = {
          ...baseCondition,
          recorder: { reference: 'Practitioner/example-practitioner' }
        } as unknown as fhir4.Condition;
        (patient.entry as FHIRBundleEntry[]).push({ resource: condition });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or STU3 if Condition does not have an identifying element', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseCondition } });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'STU3']);
      });
    });

    describe('Encounters', () => {
      const baseEncounter = {
        resourceType: 'Encounter' as const,
        id: 'example-encounter',
        status: 'in-progress' as const,
        subject: {
          reference: 'Patient/example-patient'
        },
        class: {
          system: 'http://hl7.org/fhir/v3/ActCode',
          code: 'IMP',
          display: 'inpatient encounter'
        }
      };

      it('should detect STU3 if Encounter.incomingReferral is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const encounter = {
          ...baseEncounter,
          incomingReferral: { reference: 'ReferralRequest/example-referral-request' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseEncounter } }); // first encounter isn't necessarily STU3
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter }); // second encounter indicates STU3
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 or DSTU2 if Encounter.incomingReferral is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const encounter = {
          ...baseEncounter,
          incomingReferral: { reference: 'ReferralRequest/example-referral-request' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3', 'DSTU2']);
      });

      it('should detect STU3 if Encounter.reason is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const encounter = {
          ...baseEncounter,
          reason: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 or DSTU2 if Encounter.reason is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const encounter = {
          ...baseEncounter,
          reason: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3', 'DSTU2']);
      });

      it('should detect R4 if Encounter.basedOn is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const encounter = {
          ...baseEncounter,
          basedOn: { reference: 'ServiceRequest/example-service-request' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseEncounter } }); // first encounter isn't necessarily R4
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter }); // second encounter indicates R4
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Encounter.basedOn is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const encounter = {
          ...baseEncounter,
          basedOn: { reference: 'ServiceRequest/example-service-request' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseEncounter } }); // first encounter isn't necessarily R4
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter }); // second encounter indicates R4
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Encounter.serviceType is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const encounter = {
          ...baseEncounter,
          serviceType: { coding: [{ code: 'example-service', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Encounter.serviceType is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const encounter = {
          ...baseEncounter,
          serviceType: { coding: [{ code: 'example-service', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Encounter.reasonCode is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const encounter = {
          ...baseEncounter,
          reasonCode: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Encounter.reasonCode is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const encounter = {
          ...baseEncounter,
          reasonCode: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Encounter.reasonReference is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const encounter = {
          ...baseEncounter,
          reasonReference: { reference: 'Observation/example-observation' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Encounter.reasonReference is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const encounter = {
          ...baseEncounter,
          reasonReference: { reference: 'Observation/example-observation' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or STU3 if Encounter does not have an identifying element', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const encounter = {
          ...baseEncounter
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: encounter });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'STU3']);
      });
    });

    describe('MedicationRequests', () => {
      const baseMedicationRequest = {
        resourceType: 'MedicationRequest' as const,
        id: 'example-medication-request',
        status: 'active' as const,
        intent: 'order' as const,
        medicationReference: {
          reference: 'Medication/example-medication'
        },
        subject: {
          reference: 'Patient/example-patient'
        }
      };

      it('should detect STU3 when MedicationRequest.definition is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationRequest = {
          ...baseMedicationRequest,
          definition: { reference: 'PlanDefinition/example-plan-definition' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseMedicationRequest } });
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 when MedicationRequest.definition is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationRequest = {
          ...baseMedicationRequest,
          definition: { reference: 'PlanDefinition/example-plan-definition' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseMedicationRequest } });
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 when MedicationRequest.context is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationRequest = {
          ...baseMedicationRequest,
          context: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 when MedicationRequest.context is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationRequest = {
          ...baseMedicationRequest,
          context: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect R4 if MedicationRequest.statusReason is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationRequest = {
          ...baseMedicationRequest,
          statusReason: { coding: [{ code: 'example-status-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseMedicationRequest } });
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if MedicationRequest.statusReason is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationRequest = {
          ...baseMedicationRequest,
          statusReason: { coding: [{ code: 'example-status-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseMedicationRequest } });
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if MedicationRequest.encounter is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationRequest = {
          ...baseMedicationRequest,
          encounter: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if MedicationRequest.encounter is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationRequest = {
          ...baseMedicationRequest,
          encounter: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if MedicationRequest.performer is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationRequest = {
          ...baseMedicationRequest,
          performer: { reference: 'Practitioner/example-practitioner' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if MedicationRequest.performer is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationRequest = {
          ...baseMedicationRequest,
          performer: { reference: 'Practitioner/example-practitioner' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if MedicationRequest.performerType is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationRequest = {
          ...baseMedicationRequest,
          performerType: { coding: [{ code: 'example-performer-type', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if MedicationRequest.performerType is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationRequest = {
          ...baseMedicationRequest,
          performerType: { coding: [{ code: 'example-performer-type', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or STU3 if MedicationRequest does not have an identifying element', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationRequest = {
          ...baseMedicationRequest
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationRequest });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'STU3']);
      });

      it('should detect R4 or STU3 when any MedicationRequest is present even if no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        (patient.entry as FHIRBundleEntry[]).push({ resource: { ...baseMedicationRequest } });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'STU3']);
      });
    });

    describe('MedicationStatements', () => {
      const baseMedicationStatement = {
        resourceType: 'MedicationStatement' as const,
        id: 'example-medication-statement',
        status: 'active' as const,
        medicationReference: {
          reference: 'Medication/example-medication'
        },
        subject: {
          reference: 'Patient/example-patient'
        }
      };

      it('should detect STU3 if MedicationStatement.taken is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationStatement = {
          ...baseMedicationStatement,
          taken: 'y'
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationStatement });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if MedicationStatement.taken is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationStatement = {
          ...baseMedicationStatement,
          taken: 'y'
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationStatement });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if MedicationStatement.reasonNotTaken is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationStatement = {
          ...baseMedicationStatement,
          reasonNotTaken: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationStatement });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 or DSTU2 if MedicationStatement.reasonNotTaken is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationStatement = {
          ...baseMedicationStatement,
          reasonNotTaken: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationStatement });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3', 'DSTU2']);
      });

      it('should detect R4 if MedicationStatement.statusReason is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationStatement: fhir4.MedicationStatement = {
          ...baseMedicationStatement,
          statusReason: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        } as unknown as fhir4.MedicationStatement;
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationStatement });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if MedicationStatement.statusReason is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const medicationStatement: fhir4.MedicationStatement = {
          ...baseMedicationStatement,
          statusReason: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        } as unknown as fhir4.MedicationStatement;
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationStatement });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or STU3 if MedicationStatement does not have an identifying element', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const medicationStatement = {
          ...baseMedicationStatement
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: medicationStatement });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'STU3']);
      });
    });

    describe('Observations', () => {
      const baseObservation = {
        resourceType: 'Observation' as const,
        id: 'example-observation',
        status: 'final' as const,
        code: {
          coding: [
            {
              code: 'example-observation',
              system: 'http://example.com',
              display: 'example observation'
            }
          ]
        },
        subject: {
          reference: 'Patient/example-patient'
        }
      };

      it('should detect STU3 if Observation.context is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          context: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Observation.context is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          context: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Observation.comment is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          comment: 'example comment'
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Observation.comment is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          comment: 'example comment'
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Observation.related is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          related: { target: { reference: 'Observation/example-observation' } }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 or DSTU2 if Observation.related is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          related: { target: { reference: 'Observation/example-observation' } }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3', 'DSTU2']);
      });

      it('should detect R4 if Observation.encounter is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          encounter: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or DSTU2 if Observation.encounter is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          encounter: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'DSTU2']);
      });

      it('should detect R4 if Observation.note is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          note: 'example note'
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.note is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          note: 'example note'
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.partOf is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          partOf: { reference: 'Procedure/example-procedure' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.partOf is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          partOf: { reference: 'Procedure/example-procedure' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.focus is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          focus: { reference: 'Patient/example-patient' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.focus is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          focus: { reference: 'Patient/example-patient' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.hasMember is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          hasMember: { reference: 'Observation/example-observation' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.hasMember is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          hasMember: { reference: 'Observation/example-observation' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.derivedFrom is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation,
          derivedFrom: { reference: 'Observation/example-observation' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Observation.derivedFrom is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const observation = {
          ...baseObservation,
          derivedFrom: { reference: 'Observation/example-observation' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or STU3 if Observation does not have an identifying element', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const observation = {
          ...baseObservation
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: observation });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'STU3']);
      });
    });

    describe('Procedures', () => {
      const baseProcedure = {
        resourceType: 'Procedure' as const,
        id: 'example-procedure',
        status: 'in-progress' as const,
        subject: {
          reference: 'Patient/example-patient'
        },
        code: {
          coding: [
            {
              code: 'example-procedure',
              system: 'http://example.com',
              display: 'example procedure'
            }
          ]
        }
      };

      it('should detect STU3 if Procedure.definition is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          definition: { reference: 'PlanDefinition/example-plan-definition' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Procedure.definition is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const procedure = {
          ...baseProcedure,
          definition: { reference: 'PlanDefinition/example-plan-definition' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Procedure.notDone is present (false)', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          notDone: false // note: this is a boolean so be sure the logic works with both values
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Procedure.notDone is present (true)', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          notDone: true // note: this is a boolean so be sure the logic works with both values
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Procedure.notDone is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const procedure = {
          ...baseProcedure,
          notDone: false // note: this is a boolean so be sure the logic works with both values
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Procedure.notDoneReason is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          notDoneReason: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Procedure.notDoneReason is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const procedure = {
          ...baseProcedure,
          notDoneReason: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Procedure.context is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          context: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect STU3 if Procedure.context is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const procedure = {
          ...baseProcedure,
          context: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['STU3']);
      });

      it('should detect R4 if Procedure.statusReason is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          statusReason: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Procedure.statusReason is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const procedure = {
          ...baseProcedure,
          statusReason: { coding: [{ code: 'example-reason', system: 'http://example.com' }] }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Procedure.encounter is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          encounter: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or DSTU2 if Procedure.encounter is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const procedure = {
          ...baseProcedure,
          encounter: { reference: 'Encounter/example-encounter' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'DSTU2']);
      });

      it('should detect R4 if Procedure.recorder is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          recorder: { reference: 'Patient/example-patient' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Procedure.recorder is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const procedure = {
          ...baseProcedure,
          recorder: { reference: 'Patient/example-patient' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Procedure.asserter is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure,
          asserter: { reference: 'Patient/example-patient' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 if Procedure.asserter is present and no last name is present', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const resource = (patient.entry as FHIRBundleEntry[])[0].resource as fhir3.Patient | fhir4.Patient;
        const name = resource.name;
        if (name && name[0]) {
          delete name[0].family;
        }
        const procedure = {
          ...baseProcedure,
          asserter: { reference: 'Patient/example-patient' }
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4']);
      });

      it('should detect R4 or STU3 if Procedure does not have an identifying element', () => {
        const patient = _.cloneDeep(basePatient) as PatientBundle;
        const procedure = {
          ...baseProcedure
        };
        (patient.entry as FHIRBundleEntry[]).push({ resource: procedure });
        const version = autoDetectFHIRVersion({ patient });
        expect(version).toEqual(['R4', 'STU3']);
      });
    });
  });
});
