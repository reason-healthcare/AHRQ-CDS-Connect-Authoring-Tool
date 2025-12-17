interface Option {
  value: string;
  label: string;
}

interface RequestElement {
  name: string;
  label: string;
  required: boolean;
  type: string;
  options?: Option[];
}

interface RequestStructure {
  name: string;
  elements: RequestElement[];
}

const statusOptions: Option[] = [
  // Note: limited set of status values because only some make sense when creating a suggestion
  { value: 'draft', label: 'draft' },
  { value: 'active', label: 'active' },
  { value: 'unknown', label: 'unknown' }
];

const intentOptions: Option[] = [
  { value: 'proposal', label: 'proposal' },
  { value: 'plan', label: 'plan' },
  { value: 'directive', label: 'directive' },
  { value: 'order', label: 'order' },
  { value: 'original-order', label: 'original-order' },
  { value: 'reflex-order', label: 'reflex-order' },
  { value: 'filler-order', label: 'filler-order' },
  { value: 'instance-order', label: 'instance-order' },
  { value: 'option', label: 'option' }
];

const priorityOptions: Option[] = [
  { value: 'routine', label: 'routine' },
  { value: 'urgent', label: 'urgent' },
  { value: 'asap', label: 'asap' },
  { value: 'stat', label: 'stat' }
];

const medicationRequest: RequestStructure = {
  name: 'MedicationRequest',
  elements: [
    {
      name: 'medicationCodeableConcept',
      label: 'Medication Codeable Concept',
      required: true, // 1..1
      type: 'codeableConcept'
    },
    {
      name: 'status',
      label: 'Status',
      options: statusOptions,
      required: true, // 1..1
      type: 'code'
    },
    {
      name: 'intent',
      label: 'Intent',
      options: intentOptions.filter(i => i.value !== 'directive'),
      required: true, // 1..1
      type: 'code'
    },
    {
      name: 'priority',
      label: 'Priority',
      options: priorityOptions,
      required: false, // 0..1
      type: 'code'
    },
    {
      name: 'reasonCode',
      label: 'Reason Code',
      required: false, // 0..*
      type: 'codeableConcept'
    },
    {
      name: 'category',
      label: 'Category',
      required: false, // 0..*
      type: 'codeableConcept'
    }
  ]
};

const serviceRequest: RequestStructure = {
  name: 'ServiceRequest',
  elements: [
    {
      name: 'code',
      label: 'Code',
      required: true, // 1..1
      type: 'codeableConcept'
    },
    {
      name: 'status',
      label: 'Status',
      options: statusOptions,
      required: true, // 1..1
      type: 'code'
    },
    {
      name: 'intent',
      label: 'Intent',
      options: intentOptions,
      required: true, // 1..1
      type: 'code'
    },
    {
      name: 'priority',
      label: 'Priority',
      options: priorityOptions,
      required: false, // 0..1
      type: 'code'
    },
    {
      name: 'reasonCode',
      label: 'Reason Code',
      required: false, // 0..*
      type: 'codeableConcept'
    },
    {
      name: 'category',
      label: 'Category',
      required: false, // 0..*
      type: 'codeableConcept'
    }
  ]
};

interface CodeableConcept {
  text: string; // CodeableConcept text
  code: string;
  display: string;
  system: string;
  uri: string;
}

const codeableConcept: CodeableConcept = {
  text: '',
  code: '',
  display: '',
  system: '',
  uri: ''
};

const code: string = '';

interface AllRequests {
  MedicationRequest: RequestStructure;
  ServiceRequest: RequestStructure;
}

interface TypesInitialValues {
  codeableConcept: CodeableConcept;
  code: string;
}

const allRequests: AllRequests = { MedicationRequest: medicationRequest, ServiceRequest: serviceRequest };
const typesInitialValues: TypesInitialValues = { codeableConcept, code };

export { allRequests, typesInitialValues };
