import React, { useState } from 'react';
import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { Autocomplete, Paper, TextField } from '@mui/material';
import { Modal } from 'components/elements';
import { EditorsTemplate } from 'components/builder/templates';
import { useFieldStyles } from 'styles/hooks';
import { allRequests, typesInitialValues } from './structuredRequestFields';
import type { RecommendationAction as RecommendationActionType } from '../../../types/artifact';

interface RequestElement {
  name: string;
  label: string;
  required: boolean;
  type: 'code' | 'codeableConcept';
  options?: Array<{ value: string; label: string }>;
}

interface Request {
  name: string;
  elements: RequestElement[];
}

interface CodeableConceptValue {
  code?: string;
  display?: string;
  system?: string;
  uri?: string;
  text?: string;
}

type ActionResourceValue = string | CodeableConceptValue | null;

interface ActionResource {
  resourceType: string;
  medicationCodeableConcept?: CodeableConceptValue;
  code?: CodeableConceptValue;
  status?: string;
  intent?: string;
  priority?: string;
  reasonCode?: CodeableConceptValue;
  category?: CodeableConceptValue;
  [key: string]: ActionResourceValue | undefined;
}

interface ActionState {
  description: string;
  resource: ActionResource;
}

const getInitialAction = (type: string): ActionState => {
  const request = allRequests[type as keyof typeof allRequests] as Request;
  const initialAction: ActionState = { description: '', resource: { resourceType: request.name } };
  request.elements.forEach(e => {
    initialAction.resource[e.name] = typesInitialValues[e.type as keyof typeof typesInitialValues];
  });
  return initialAction;
};

const getCodeFromAction = (value: CodeableConceptValue | null | undefined): CodeableConceptValue | null => {
  if (value == null) {
    return null;
  }
  if (isEmpty(value.code) && isEmpty(value.system)) {
    return null;
  } else {
    return { code: value.code, display: value.display, system: value.system, uri: value.uri };
  }
};

const isElementValueEmpty = (value: ActionResourceValue): boolean =>
  value === '' ||
  (typeof value === 'object' &&
    value !== null &&
    (value as CodeableConceptValue).code === '' &&
    (value as CodeableConceptValue).text === '');

interface RecommendationActionModalProps {
  action: RecommendationActionType;
  closeModal: () => void;
  saveAction: (action: RecommendationActionType) => void;
  type: string;
}

const RecommendationActionModal: React.FC<RecommendationActionModalProps> = ({
  action,
  closeModal,
  saveAction,
  type
}) => {
  const fieldStyles = useFieldStyles();
  const [currentAction, setCurrentAction] = useState<ActionState>(
    isEmpty(action)
      ? getInitialAction(type)
      : { description: action.description || '', resource: action.resource as ActionResource }
  );
  const request = allRequests[type as keyof typeof allRequests] as Request;
  const requestElements = request.elements;

  const onChange = (field: string, value: ActionResourceValue) => {
    if (field === 'description') {
      // description is only top level property that changes, so handle it separately to simplify things
      setCurrentAction({ ...currentAction, description: value as string });
    } else {
      setCurrentAction({ ...currentAction, resource: { ...currentAction.resource, [field]: value } });
    }
  };

  const updateCodeableConcept = (field: string, value: CodeableConceptValue | string | null, isText: boolean) => {
    if (isText) {
      setCurrentAction({
        ...currentAction,
        resource: {
          ...currentAction.resource,
          [field]: { ...(currentAction.resource[field] as CodeableConceptValue), text: value as string }
        }
      });
    } else {
      // Reset fields to empty string when deleting codes. value will be null if code is being deleted.
      const codeValue = value as CodeableConceptValue | null;
      const { code = '', display = '', system = '', uri = '' } = codeValue ?? {};
      setCurrentAction({
        ...currentAction,
        resource: {
          ...currentAction.resource,
          [field]: { ...(currentAction.resource[field] as CodeableConceptValue), code, display, system, uri }
        }
      });
    }
  };

  const isComplete = (): boolean => {
    const requiredElements = requestElements.filter(e => e.required).map(e => e.name);
    const isComplete =
      currentAction.description !== '' &&
      requiredElements.every(name => !isElementValueEmpty(currentAction.resource[name]));
    return isComplete;
  };

  const onSubmit = () => {
    saveAction({
      description: currentAction.description,
      resource: currentAction.resource
    } as RecommendationActionType);
  };

  const renderInput = (element: RequestElement) => {
    switch (element.type) {
      case 'code':
        return (
          <Autocomplete<{ value: string; label: string }>
            autoSelect
            autoHighlight
            className={fieldStyles.fieldInputLg}
            getOptionLabel={option => option?.label || ''}
            onChange={(e, option) => onChange(element.name, option?.value ?? '')}
            options={element.options}
            renderInput={params => <TextField {...params} placeholder="Select..." required />}
            value={element.options?.find(option => option.value === currentAction.resource[element.name]) ?? null}
          />
        );
      case 'codeableConcept':
        return (
          <Paper className={fieldStyles.group}>
            <TextField
              className={fieldStyles.field}
              id="codeable-concept-text"
              name="Text"
              placeholder="CodeableConcept text"
              onChange={event => updateCodeableConcept(element.name, event.target.value, true)}
              value={(currentAction.resource[element.name] as CodeableConceptValue)?.text}
            />
            <EditorsTemplate
              type="system_code"
              handleUpdateEditor={code => updateCodeableConcept(element.name, code, false)}
              value={getCodeFromAction(currentAction.resource[element.name] as CodeableConceptValue)}
            />
          </Paper>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      handleCloseModal={closeModal}
      handleSaveModal={onSubmit}
      isOpen
      maxWidth="xl"
      hasEnterKeySubmit={false}
      submitButtonText={isEmpty(action) ? 'Create' : 'Update'}
      title={isEmpty(action) ? 'New Action' : 'Update Action'}
      submitDisabled={!isComplete()}
    >
      <div>
        <div className={fieldStyles.field}>
          <label className={fieldStyles.fieldLabel} htmlFor="type-create">
            Type:
          </label>
          <div id="type-create" className={fieldStyles.fieldInput}>
            Create
          </div>
        </div>
        <div className={fieldStyles.field}>
          <label className={fieldStyles.fieldLabel} htmlFor="request-type">
            Request Type<span className={fieldStyles.required}>*</span>:
          </label>
          <div id="request-type" className={fieldStyles.fieldInput}>
            {request.name}
          </div>
        </div>
        <div className={fieldStyles.field}>
          <label className={clsx(fieldStyles.fieldLabel, fieldStyles.fieldLabelGroup)} htmlFor="description">
            Description<span className={fieldStyles.required}>*</span>:
          </label>
          <div className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputFullWidth)}>
            <TextField
              className={fieldStyles.field}
              id="description"
              name="description"
              placeholder="Description of your action..."
              required={true}
              onChange={event => onChange('description', event.target.value)}
              value={currentAction.description}
            />
          </div>
        </div>
        {Object.keys(currentAction.resource)
          .filter(key => key !== 'resourceType')
          .map(key => {
            const element = requestElements.find(e => e.name === key);
            if (!element) return null;
            return (
              <div key={key} className={fieldStyles.field}>
                <label className={fieldStyles.fieldLabel} htmlFor={key}>
                  {element.label}
                  {element.required ? <span className={fieldStyles.required}>*</span> : ''}:
                </label>
                <div id={key} className={clsx(fieldStyles.fieldInput, fieldStyles.fieldInputFullWidth)}>
                  {renderInput(element)}
                </div>
              </div>
            );
          })}
      </div>
    </Modal>
  );
};

export default RecommendationActionModal;
