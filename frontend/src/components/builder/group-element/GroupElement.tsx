import React, { useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useAppSelector } from '../../../store/hooks';
import { Stack } from '@mui/material';
import _ from 'lodash';
import { getFieldWithId, isReturnTypeValid } from 'utils/instances';
import { ElementCard } from 'components/elements';
import { ElementSelect } from 'components/builder/element-select';
import ExpressionPhrase from 'components/builder/ExpressionPhrase';
import { ReturnTypeTemplate } from 'components/builder/templates';
import type { Instance } from '../../../utils/instances';
import type { Field } from '../../../types/artifact';
import type { Alert } from '../../../utils/warnings';

interface GroupElementProps {
  alerts?: Alert[];
  allowComment?: boolean;
  allowIndent?: boolean;
  allowOutdent?: boolean;
  children?: React.ReactNode;
  disable: boolean;
  disableTitleField?: boolean;
  elementUniqueId?: string;
  groupInstance: Instance;
  groupTitleField?: Field;
  handleAddElement: (template: Instance) => void;
  handleDeleteElement: () => void;
  handleIndent?: () => void;
  handleOutdent?: () => void;
  handleUpdateElement: (
    updatedFields: Record<
      string,
      | string
      | number
      | boolean
      | null
      | { id?: string; value?: string | number | { id?: string; name?: string; value?: string; type?: string } | null }
    >
  ) => void;
  hasErrors: boolean;
  indentParity?: string;
  isWrapper?: boolean;
  label?: string;
  root: boolean;
  showReturnType?: boolean;
}

const GroupElement: React.FC<GroupElementProps> = ({
  alerts,
  allowComment = true,
  allowIndent,
  allowOutdent,
  children,
  disable,
  disableTitleField = false,
  elementUniqueId,
  groupInstance,
  groupTitleField,
  handleAddElement,
  handleDeleteElement,
  handleIndent,
  handleOutdent,
  handleUpdateElement,
  hasErrors,
  indentParity,
  isWrapper,
  label = 'Group',
  root,
  showReturnType
}) => {
  const artifact = useAppSelector(state => state.artifacts.artifact);
  const { baseElements } = artifact;
  const [showAllContent, setShowAllContent] = useState(true);
  const commentField = getFieldWithId(groupInstance.fields, 'comment') as Field;
  const titleField = (groupTitleField ?? getFieldWithId(groupInstance.fields, 'element_name')) as Field;
  const disableDeleteMessage = isWrapper
    ? `To delete this ${label}, remove all references to it.`
    : 'To edit or delete this element, remove all references to the Base Element List.';
  const hasValidReturnType = isReturnTypeValid(
    groupInstance.returnType,
    groupInstance.id,
    groupInstance.childInstances
  );

  if (root) {
    return (
      <Stack data-testid="root">
        {children}
        <ElementSelect
          excludeListOperations
          handleAddElement={handleAddElement}
          indentParity={indentParity}
          isDisabled={disable}
          parentElementId={elementUniqueId}
        />
      </Stack>
    );
  }

  return (
    <ElementCard
      alerts={alerts}
      allowComment={allowComment}
      allowIndent={allowIndent}
      allowOutdent={allowOutdent}
      collapsedContent={<ExpressionPhrase closed instance={groupInstance} baseElements={baseElements} />}
      commentField={commentField}
      disableDeleteMessage={disable && disableDeleteMessage}
      disableIndentMessage={
        disable && 'To edit or delete this element, remove all references to the Base Element List.'
      }
      disableTitleField={disableTitleField}
      handleDelete={handleDeleteElement}
      handleIndent={handleIndent}
      handleOutdent={handleOutdent}
      handleUpdateComment={updatedField => handleUpdateElement({ [updatedField.id]: updatedField.value })}
      handleUpdateTitleField={updatedField => handleUpdateElement({ [updatedField.id]: updatedField.value })}
      hasErrors={hasErrors}
      indentParity={indentParity}
      isBaseElement={false} // Groups will never be base element uses
      label={label}
      setShowAllContent={setShowAllContent}
      showAllContent={showAllContent}
      titleField={titleField}
    >
      <Stack data-testid="group-element">
        <ExpressionPhrase instance={groupInstance} baseElements={baseElements} />
        {showReturnType && (
          <ReturnTypeTemplate
            returnType={_.startCase(groupInstance.returnType)}
            returnTypeIsValid={hasValidReturnType}
          />
        )}
        {children}
        {/* Subpopulations and ListGroups will just use the containing group's select - they don't need their own */}
        {!isWrapper && (
          <ElementSelect
            excludeListOperations
            handleAddElement={handleAddElement}
            indentParity={indentParity}
            isDisabled={disable}
            parentElementId={elementUniqueId}
          />
        )}
      </Stack>
    </ElementCard>
  );
};

export default GroupElement;
