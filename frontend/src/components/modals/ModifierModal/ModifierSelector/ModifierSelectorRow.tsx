import React from 'react';
import { Alert, Card, CardContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import clsx from 'clsx';

import { ModifierForm } from 'components/builder/modifiers';
import { Tooltip } from 'components/elements';
import { modifierCanBeRemoved } from 'components/builder/modifiers/utils';
import { validateModifier } from 'utils/instances';
import type { Instance, Modifier } from 'utils/instances';
import useStyles from '../styles';

interface ModifierSelectorRowProps {
  elementInstance: Instance;
  handleRemoveModifier: () => void;
  handleUpdateModifier: (values: Record<string, unknown>) => void;
  isFirst: boolean;
  modifier: Modifier & { uniqueId?: string; name?: string };
  modifiersToAdd: Array<Modifier & { uniqueId?: string; name?: string }>;
}

const ModifierSelectorRow: React.FC<ModifierSelectorRowProps> = ({
  elementInstance,
  handleRemoveModifier,
  handleUpdateModifier,
  isFirst,
  modifier,
  modifiersToAdd
}) => {
  const styles = useStyles();
  const validationWarning = validateModifier(modifier);
  const { canBeRemoved, tooltipText } = modifierCanBeRemoved(
    Boolean((elementInstance.usedBy?.length ?? 0) > 0),
    modifiersToAdd.indexOf(modifier),
    elementInstance.returnType,
    modifiersToAdd
  );

  return (
    <div className={styles.rulesCardGroup}>
      <div className={clsx(styles.line, styles.lineHorizontal)}></div>
      <div className={clsx(styles.line, styles.lineVertical, isFirst && styles.lineVerticalTop)}></div>

      <div className={styles.indent}>
        <Card className={styles.modifierCard} data-testid="modifier-card">
          <CardContent className={styles.modifierCardContent}>
            <ModifierForm
              elementInstance={elementInstance}
              handleUpdateModifier={(updatedModifier: Modifier | Modifier[]) => {
                // ModifierForm passes full modifier, but we need to extract just the values
                const modifierToUpdate = Array.isArray(updatedModifier) ? updatedModifier[0] : updatedModifier;
                if (modifierToUpdate && modifierToUpdate.values) {
                  handleUpdateModifier(modifierToUpdate.values);
                }
              }}
              modifier={modifier}
            />

            {validationWarning && <Alert severity="error">{validationWarning}</Alert>}

            <div className={styles.deleteButton}>
              <Tooltip enabled={!canBeRemoved} placement="left" title={tooltipText}>
                <IconButton
                  aria-label="delete modifier"
                  color="primary"
                  disabled={!canBeRemoved}
                  onClick={handleRemoveModifier}
                  size="large"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModifierSelectorRow;
