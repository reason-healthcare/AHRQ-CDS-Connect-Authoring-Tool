import type { Dispatch } from 'redux';
import * as types from './types';
import { getAllElements, getBaseElementsInUse, getLibrariesInUse, getParametersInUse } from 'components/builder/utils';
import { checkForNeedToPromote, isElementUnionIntersect } from 'utils/lists';
import type { Artifact, BaseElement, Parameter, BaseElementList } from '../types/artifact';

export function updateArtifact(artifactToUpdate: Artifact, props: Partial<Artifact>) {
  return (dispatch: Dispatch) => {
    const artifact: Artifact = {
      ...artifactToUpdate,
      ...props
    };

    const allElements = getAllElements(artifact) ?? [];
    const baseElementsInUse = getBaseElementsInUse(allElements);
    const parametersInUse = getParametersInUse(allElements);
    const librariesInUse = getLibrariesInUse(allElements);

    // Add uniqueId to list on base element to mark where it is used.
    if (Array.isArray(artifact.baseElements)) {
      artifact.baseElements.forEach((element: BaseElement) => {
        const elementInUse = baseElementsInUse.find(
          (usedBaseEl: { baseElementId?: string }) => usedBaseEl.baseElementId === element.uniqueId
        );
        element.usedBy = elementInUse ? (elementInUse as { usedBy?: string[] }).usedBy || [] : [];
      });
    }

    // Add uniqueId to list on parameter to mark where it is used.
    if (Array.isArray(artifact.parameters)) {
      artifact.parameters.forEach((parameter: Parameter) => {
        const parameterInUse = parametersInUse.find(
          (usedParameter: { parameterId?: string }) => usedParameter.parameterId === parameter.uniqueId
        );
        parameter.usedBy = parameterInUse ? (parameterInUse as { usedBy?: string[] }).usedBy || [] : [];
      });
    }

    return dispatch({
      type: types.UPDATE_ARTIFACT,
      artifact,
      librariesInUse
    });
  };
}

export function loadArtifact(artifact: Artifact) {
  return (dispatch: Dispatch) => {
    const allElements = getAllElements(artifact) ?? [];
    const librariesInUse = getLibrariesInUse(allElements);

    // NOTE: This check is to ensure any Union/Intersect list groups that were created
    // before the "needToPromote" flag was added to properly promote lists
    // in CQL are marked for promotion.
    // This section of code is only really useful for a limited amount of time,
    // because eventually we can assume any artifact being used has the property
    // set appropriately. Consider deleting this after one year (April 2024).
    if (Array.isArray(artifact.baseElements)) {
      artifact.baseElements.forEach((baseElement: BaseElement) => {
        if (isElementUnionIntersect(baseElement.id) && baseElement.childInstances) {
          checkForNeedToPromote(baseElement as BaseElementList);
        }
      });
    }

    return dispatch({
      type: types.LOAD_ARTIFACT,
      artifact,
      librariesInUse
    });
  };
}

export function artifactSaved(artifact: Artifact) {
  return (dispatch: Dispatch) => {
    return dispatch({
      type: types.SAVE_ARTIFACT_SUCCESS,
      artifact
    });
  };
}
