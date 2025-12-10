import React, { useMemo, useState } from 'react';
import { Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';

import { fetchModifiers } from 'queries/modifiers';
import { ElementCard } from 'components/elements';
import ExpressionPhrase from 'components/builder/ExpressionPhrase';
import { filterRelevantModifiers, getFieldWithId, getReturnType } from 'utils/instances';
import type { Instance, Modifier } from '../../../utils/instances';
import type { Alert } from '../../../utils/warnings';
import type { Field } from '../../../types/artifact';
import ArtifactElementActions from './ArtifactElementActions';
import ArtifactElementBody from './ArtifactElementBody';

interface ArtifactElementProps {
  alerts: Alert[];
  allowIndent?: boolean;
  allowOutdent?: boolean;
  baseElementInUsedList?: boolean;
  handleDeleteElement: () => void;
  handleIndent?: () => void;
  handleOutdent?: () => void;
  handleUpdateElement: (
    newElementField: Record<string, unknown> | Array<Record<string, unknown>>
  ) => void;
  hasErrors: boolean;
  elementInstance: Instance;
  label: string;
  indentParity?: string;
  updateModifiers: (modifiers: Modifier[], fhirVersion?: string | null) => void;
  validateReturnType?: boolean;
}

const ArtifactElement: React.FC<ArtifactElementProps> = ({
  alerts,
  allowIndent = true,
  allowOutdent,
  baseElementInUsedList,
  handleDeleteElement,
  handleIndent,
  handleOutdent,
  handleUpdateElement,
  hasErrors,
  elementInstance,
  label,
  indentParity,
  updateModifiers,
  validateReturnType
}) => {
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { baseElements, _id: artifactId } = artifact || { baseElements: undefined, _id: undefined };
  const [showAllContent, setShowAllContent] = useState(true);

  const modifiersQuery = useQuery({
    queryKey: ['modifiers', { artifactId }],
    queryFn: () => fetchModifiers({ artifactId: artifactId || '' }),
    enabled: artifactId != null && artifact != null
  });
  const modifiersByInputType = useMemo(
    () => (modifiersQuery.data as { modifiersByInputType?: Record<string, Modifier[]> })?.modifiersByInputType ?? {},
    [modifiersQuery.data]
  );
  const isLoadingModifiers = useMemo(() => modifiersQuery.isPending, [modifiersQuery.isPending]);

  if (!artifact) return null;

  const commentField: Field = (getFieldWithId(elementInstance.fields, 'comment') as Field) || {
    id: 'comment',
    type: undefined,
    name: undefined,
    value: undefined
  };
  const titleField: Field = (getFieldWithId(elementInstance.fields, 'element_name') as Field) || {
    id: 'element_name',
    type: undefined,
    name: undefined,
    value: undefined
  };
  const baseElementIsUsed = elementInstance.usedBy ? elementInstance.usedBy.length !== 0 : false;

  // Base element uses will have _vsac included in the id, but should not support additional VS and codes
  const allowsVSAC =
    elementInstance.id && elementInstance.id.includes('_vsac') && elementInstance.type !== 'baseElement';
  const relevantModifiers = filterRelevantModifiers(
    modifiersByInputType[getReturnType(elementInstance.returnType, elementInstance.modifiers)],
    elementInstance
  );

  return (
    <>
      <ElementCard
        actions={
          (!elementInstance.cannotHaveModifiers && relevantModifiers.length > 0) || allowsVSAC ? (
            <ArtifactElementActions
              allowsVSAC={allowsVSAC}
              hasLimitedModifiers={baseElementInUsedList || false}
              elementInstance={elementInstance}
              handleUpdateElement={handleUpdateElement}
              isLoadingModifiers={isLoadingModifiers}
              modifiersByInputType={modifiersByInputType}
              updateModifiers={updateModifiers}
            />
          ) : null
        }
        alerts={alerts}
        allowIndent={allowIndent}
        allowOutdent={allowOutdent}
        collapsedContent={<ExpressionPhrase closed instance={elementInstance} baseElements={baseElements || []} />}
        commentField={commentField}
        disableDeleteMessage={
          (baseElementIsUsed || baseElementInUsedList) &&
          `To delete this element, remove all references to ${baseElementInUsedList ? 'the Base Element List' : 'it'}.`
        }
        disableIndentMessage={
          baseElementInUsedList && 'To edit or delete this element, remove all references to the Base Element List.'
        }
        disableTitleField={false}
        handleDelete={handleDeleteElement}
        handleIndent={handleIndent}
        handleOutdent={handleOutdent}
        handleUpdateComment={(field: Field) => handleUpdateElement({ comment: field.value })}
        handleUpdateTitleField={(field: Field) => handleUpdateElement({ element_name: field.value })}
        hasErrors={hasErrors}
        indentParity={indentParity}
        label={label}
        setShowAllContent={(value: boolean | null) => setShowAllContent(value ?? true)}
        showAllContent={showAllContent}
        titleField={titleField}
      >
        <Stack spacing={2}>
          <ArtifactElementBody
            baseElementIsUsed={baseElementIsUsed || baseElementInUsedList || false}
            elementInstance={elementInstance as any}
            handleUpdateElement={handleUpdateElement as any}
            updateModifiers={updateModifiers}
            validateReturnType={validateReturnType}
          />
        </Stack>
      </ElementCard>
    </>
  );
};

export default ArtifactElement;
