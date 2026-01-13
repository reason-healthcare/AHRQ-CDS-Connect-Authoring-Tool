import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Card, CardActions, CardContent, CardHeader } from '@mui/material';

import ElementCardHeader from './ElementCardHeader';
import ElementCardHeaderActions from './ElementCardHeaderActions';
import type { Alert } from 'utils/warnings';
import type { Field } from '../../../types/artifact';
import useStyles from './styles';

interface ElementCardProps {
  actions?: React.ReactElement;
  alerts?: Alert[];
  allowComment?: boolean;
  allowIndent?: boolean;
  allowOutdent?: boolean;
  children: React.ReactElement;
  collapsedContent?: React.ReactElement;
  commentField: Field;
  disableDeleteMessage: string | boolean;
  disableIndentMessage?: string | boolean;
  disableTitleField?: boolean;
  handleDelete: () => void;
  handleIndent?: () => void;
  handleOutdent?: () => void;
  handleUpdateComment: (update: Record<string, string>) => void;
  handleUpdateTitleField: (update: Record<string, string>) => void;
  hasErrors?: boolean;
  indentParity?: string;
  isBaseElement?: boolean;
  label: string;
  setShowAllContent: (value: boolean | null) => void;
  showAllContent?: boolean | null;
  titleField: Field;
}

const ElementCard: React.FC<ElementCardProps> = ({
  actions,
  alerts,
  allowComment,
  allowIndent,
  allowOutdent,
  children,
  collapsedContent,
  commentField,
  disableDeleteMessage,
  disableIndentMessage,
  disableTitleField,
  handleDelete,
  handleIndent,
  handleOutdent,
  handleUpdateComment,
  handleUpdateTitleField,
  hasErrors,
  indentParity,
  isBaseElement,
  label,
  setShowAllContent,
  showAllContent,
  titleField
}) => {
  const styles = useStyles();
  const [showContent, setShowContent] = useState(true);
  const [showComment, setShowComment] = useState(false);

  useEffect(() => {
    if (showAllContent != null) setShowContent(showAllContent);
  }, [showAllContent]);

  const handleToggleContent = (): void => {
    setShowContent(!showContent);
    setShowAllContent(null);
  };

  const background = styles[indentParity as keyof typeof styles] ?? '';
  const classNames = clsx(isBaseElement && styles.baseElement, background);

  return (
    <Card className={classNames}>
      <CardHeader
        action={
          <ElementCardHeaderActions
            allowComment={allowComment}
            allowIndent={allowIndent}
            allowOutdent={allowOutdent}
            disableDeleteMessage={disableDeleteMessage}
            disableIndentMessage={disableIndentMessage}
            handleDelete={handleDelete}
            handleIndent={handleIndent}
            handleOutdent={handleOutdent}
            handleToggleContent={handleToggleContent}
            handleToggleComment={() => setShowComment(!showComment)}
            hasComment={Boolean(commentField.value)}
            label={label}
            showContent={showContent}
            showComment={showComment}
            titleValue={titleField.value as string}
          />
        }
        title={
          <ElementCardHeader
            alerts={alerts}
            collapsedContent={collapsedContent}
            commentField={commentField}
            handleUpdateComment={handleUpdateComment}
            handleUpdateTitleField={handleUpdateTitleField}
            hasErrors={hasErrors}
            showComment={showComment}
            showContent={showContent}
            titleField={titleField}
            titleFieldIsDisabled={disableTitleField}
            titleLabel={label}
          />
        }
      />

      {showContent && <CardContent>{children}</CardContent>}

      {actions && showContent && <CardActions>{actions}</CardActions>}
    </Card>
  );
};

export default ElementCard;
