import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircularProgress, IconButton } from '@mui/material';
import { ArrowBackIos as ArrowBackIosIcon } from '@mui/icons-material';

import ConjunctionCard from './ConjunctionCard';
import getResourceOptions from './utils/getResourceOptions';
import getModifierExpression from './utils/getModifierExpression';
import { fetchResource } from 'queries/modifier-builder';
import type { Modifier } from '../../../../utils/instances';
import type { ModifierTree, ResourceOption } from '../types';
import { useSpacingStyles } from 'styles/hooks';
import useStyles from '../styles';

interface ModifierBuilderProps {
  elementInstanceReturnType: string;
  fhirVersion: string;
  handleGoBack: () => void;
  modifierToEdit?: ModifierTree;
  modifiersToAdd: Array<Modifier & { uniqueId?: string; name?: string }>;
  setModifiersToAdd: (modifiers: Array<Modifier & { uniqueId?: string; name?: string }>) => void;
}

const ModifierBuilder: React.FC<ModifierBuilderProps> = ({
  elementInstanceReturnType,
  fhirVersion,
  handleGoBack,
  modifierToEdit,
  setModifiersToAdd
}) => {
  const [modifierTree, setModifierTree] = useState<ModifierTree>(
    modifierToEdit || {
      inputTypes: [elementInstanceReturnType],
      returnType: undefined,
      type: 'UserDefinedModifier',
      where: { id: 'root', conjunctionType: 'and', rules: [] }
    }
  );
  const resourceQuery = useQuery({
    queryKey: ['resources', { fhirVersion, elementInstanceReturnType }],
    queryFn: () => fetchResource(fhirVersion, elementInstanceReturnType)
  });
  const resourceOptions = useMemo<ResourceOption[]>(() => getResourceOptions(resourceQuery.data), [resourceQuery.data]);
  const spacingStyles = useSpacingStyles();
  const styles = useStyles();

  const getTreeReturnType = (tree: ModifierTree['where']): string | undefined => {
    if (tree.rules.length !== 0) return elementInstanceReturnType;
    return undefined;
  };

  const handleUpdateModifierTree = (tree: ModifierTree['where']): void => {
    const updatedTree: ModifierTree = { ...modifierTree, returnType: getTreeReturnType(tree), where: tree };
    setModifierTree(updatedTree);
    setModifiersToAdd([updatedTree]);
  };

  return (
    <>
      <div className={styles.navHeader}>
        <div className={styles.navHeaderGroup}>
          <div className={styles.navHeaderButtons}>
            {!modifierToEdit && (
              <IconButton aria-label="go back" onClick={handleGoBack} size="large">
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>
            )}
            <div className={styles.tag}>WHERE</div>
          </div>

          <div className={styles.modifierExpression}>{getModifierExpression(modifierTree)}</div>
        </div>
      </div>

      {resourceQuery.isLoading && (
        <div className={spacingStyles.center}>
          <CircularProgress />
        </div>
      )}

      {resourceQuery.isSuccess && (
        <ConjunctionCard
          rule={modifierTree.where}
          depth={0}
          handleUpdateConjunction={handleUpdateModifierTree}
          resourceOptions={resourceOptions}
        />
      )}
    </>
  );
};

export default ModifierBuilder;
