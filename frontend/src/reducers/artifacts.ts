import * as types from '../actions/types';
import type { Artifact, LibraryInUse } from '../types/artifact';

export interface ArtifactState {
  artifact: Artifact | null;
  artifactSaved: boolean;
  librariesInUse: LibraryInUse[];
}

interface UpdateArtifactAction {
  type: typeof types.UPDATE_ARTIFACT;
  artifact: Artifact;
  librariesInUse: LibraryInUse[];
}

interface LoadArtifactAction {
  type: typeof types.LOAD_ARTIFACT;
  artifact: Artifact;
  librariesInUse: LibraryInUse[];
}

interface SaveArtifactSuccessAction {
  type: typeof types.SAVE_ARTIFACT_SUCCESS;
  artifact: Artifact;
}

type ArtifactAction = UpdateArtifactAction | LoadArtifactAction | SaveArtifactSuccessAction;

export const defaultState: ArtifactState = {
  artifact: null,
  artifactSaved: true,
  librariesInUse: []
};

export default function artifacts(state: ArtifactState = defaultState, action: ArtifactAction): ArtifactState {
  switch (action.type) {
    case types.UPDATE_ARTIFACT:
    case types.LOAD_ARTIFACT:
      return {
        ...state,
        artifact: action.artifact,
        artifactSaved: false,
        librariesInUse: action.librariesInUse
      };
    case types.SAVE_ARTIFACT_SUCCESS:
      return {
        ...state,
        artifactSaved: true,
        artifact: action.artifact
      };
    default:
      return state;
  }
}
